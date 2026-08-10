import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  // Derive the public base URL consistently for both success and error redirects.
  // On hosted environments the raw `origin` can be an internal address; prefer
  // the x-forwarded-host header (set by the reverse proxy) when available.
  const publicBase =
    !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin

  if (code) {
    const cookieStore = await cookies()

    const redirectUrl = `${publicBase}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // Ignore if called from context where cookieStore is read-only
              }
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (data?.user) {
        const user = data.user
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          ''
        const phone = user.user_metadata?.phone || ''
        const companyName = user.user_metadata?.company_name || ''

        // Ensure user profile row exists in `public.profiles`
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            email: user.email ?? '',
            full_name: fullName,
            phone: phone,
            company_name: companyName,
          },
          { onConflict: 'id' }
        )
      }
      return response
    }
    console.error('Google OAuth exchange code error:', error)
  }

  return NextResponse.redirect(
    `${publicBase}/login?error=Google%20authentication%20failed.%20Please%20try%20again.`
  )
}
