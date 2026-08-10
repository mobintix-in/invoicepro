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

function clearSupabaseSessionCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-') || name.includes('supabase')) {
      response.cookies.delete(name)
    }
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Keep a mutable response so Supabase can write refreshed session cookies onto it.
  let response = NextResponse.next({ request })

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without configured Supabase env we cannot validate a session; treat as unauthenticated.
  let isAuthenticated = false
  let isAdmin = false
  let hasActiveSubscription = false

  if (hasSupabaseEnv) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
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
      } = await supabase.auth.getUser()
      isAuthenticated = !!user

      if (isAuthenticated) {
        // Single round-trip: are they an admin, and is their subscription active?
        const { data } = await supabase
          .rpc('my_access')
          .single<{ is_admin: boolean; is_active: boolean }>()
        isAdmin = !!data?.is_admin
        hasActiveSubscription = !!data?.is_active
      }
    } catch (error) {
      if (isStaleRefreshTokenError(error)) {
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
