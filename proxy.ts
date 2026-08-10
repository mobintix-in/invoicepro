import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isStaleRefreshTokenError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as {
    code?: string
    status?: number
    message?: string
  }

  return (
    (maybeError.code === 'refresh_token_not_found' ||
      maybeError.message?.toLowerCase().includes('refresh token not found')) &&
    maybeError.status === 400
  )
}

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as {
    name?: string
    status?: number
    message?: string
  }

  return (
    (maybeError.name === 'AuthSessionMissingError' ||
      maybeError.message?.toLowerCase().includes('auth session missing')) &&
    maybeError.status === 400
  )
}

function isSupabaseSessionCookie(name: string) {
  return name.startsWith('sb-') || name.includes('supabase')
}

function clearSupabaseSessionCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (isSupabaseSessionCookie(name)) {
      response.cookies.delete(name)
    }
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // OAuth providers return here before a Supabase session exists. The callback
  // route must exchange the authorization code and set the session cookies;
  // sending this request through the normal auth gate redirects it to /welcome
  // before that exchange can happen.
  if (pathname === '/auth/callback') {
    return NextResponse.next()
  }

  // Keep a mutable response so Supabase can write refreshed session cookies onto it.
  let response = NextResponse.next({ request })

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without configured Supabase env we cannot validate a session; treat as unauthenticated.
  let isAuthenticated = false
  let isAdmin = false
  let hasActiveSubscription = false

  const hasSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => isSupabaseSessionCookie(name))

  if (hasSupabaseEnv && hasSessionCookie) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet, headersToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
            Object.entries(headersToSet).forEach(([name, value]) =>
              response.headers.set(name, value)
            )
          },
        },
      }
    )

    // getUser() revalidates the JWT against Supabase's auth server — unlike a
    // cookie-name check, a forged cookie cannot satisfy it. A stale or missing
    // refresh token is a normal unauthenticated state, not an app-breaking error.
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        if (isMissingSessionError(error)) {
          // A signed-out or expired browser session is an expected state.
        } else if (isStaleRefreshTokenError(error)) {
          clearSupabaseSessionCookies(request, response)
        } else {
          console.error('Supabase auth middleware error:', error)
        }
      } else if (user) {
        isAuthenticated = true

        // Single round-trip: are they an admin, and is their subscription active?
        const { data, error: accessError } = await supabase
          .rpc('my_access')
          .single<{ is_admin: boolean; is_active: boolean }>()
        if (accessError) console.error('Supabase access check failed:', accessError)
        isAdmin = !!data?.is_admin
        hasActiveSubscription = !!data?.is_active
      }
    } catch (error) {
      if (isMissingSessionError(error)) {
        // A signed-out or expired browser session is an expected state.
      } else if (isStaleRefreshTokenError(error)) {
        clearSupabaseSessionCookies(request, response)
      } else {
        console.error('Supabase auth middleware error:', error)
      }
    }
  }

  // Auth-gate pages: reachable without a session, but signed-in users are sent
  // into the app (no reason to show them the marketing home or login screen).
  const isAuthGatePage = pathname === '/welcome' || pathname === '/login'
  // Open marketing pages (blog): readable by anyone, signed in or not.
  const isMarketingPage = pathname === '/blog' || pathname.startsWith('/blog/')

  if (!isAuthenticated) {
    if (isAuthGatePage || isMarketingPage) return response
    // Send visitors to the marketing home page — the front door of the service.
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // Authenticated from here on.
  if (isAuthGatePage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  if (isMarketingPage) return response

  // Paywall: without an active subscription, dashboard, subscribe screen and
  // account profile are reachable (admins also get the approval console).
  const unpaidAllowed = pathname === '/' || pathname === '/subscribe' || pathname === '/profile'
  if (!hasActiveSubscription && !isAdmin && !unpaidAllowed) {
    return NextResponse.redirect(new URL('/subscribe', request.url))
  }
  // Admins may not have a personal subscription but should still reach the admin
  // console (/admin and its sub-pages), /subscribe, and /profile freely; block
  // them from the rest only if unpaid.
  if (!hasActiveSubscription && isAdmin && !unpaidAllowed && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
