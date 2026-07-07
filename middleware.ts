import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    // cookie-name check, a forged cookie cannot satisfy it.
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
  }

  // Public pages reachable without a session: the marketing home and the auth screen.
  const isPublicPage = pathname === '/welcome' || pathname === '/login'

  if (!isAuthenticated) {
    if (isPublicPage) return response
    // Send visitors to the marketing home page — the front door of the service.
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // Authenticated from here on — no reason to see the marketing or login pages.
  if (isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Paywall: without an active subscription, only the subscribe screen and the
  // account profile are reachable (admins also get the approval console).
  const unpaidAllowed = pathname === '/subscribe' || pathname === '/profile'
  if (!hasActiveSubscription && !isAdmin && !unpaidAllowed) {
    return NextResponse.redirect(new URL('/subscribe', request.url))
  }
  // Admins may not have a personal subscription but should still reach /admin,
  // /subscribe, and /profile freely; block them from the rest only if unpaid.
  if (!hasActiveSubscription && isAdmin && !unpaidAllowed && pathname !== '/admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
