import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function publicBaseUrl(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured) return requestOrigin

  try {
    return new URL(configured).origin
  } catch {
    console.error('NEXT_PUBLIC_SITE_URL is not a valid absolute URL')
    return requestOrigin
  }
}

function safeNextPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const publicBase = publicBaseUrl(origin)
  const loginError =
    '/login?error=Google%20authentication%20failed.%20Please%20try%20again.'

  if (!code) {
    return NextResponse.redirect(`${publicBase}${loginError}`)
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(`${publicBase}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // The response below remains the authoritative cookie writer.
            }
            response.cookies.set(name, value, options)
          })
          Object.entries(headersToSet).forEach(([name, value]) =>
            response.headers.set(name, value)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('Google OAuth exchange code error:', error)
    response.headers.set('location', `${publicBase}${loginError}`)
    return response
  }

  if (data.user) {
    const user = data.user
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      ''
    const phone = user.user_metadata?.phone || ''
    const companyName = user.user_metadata?.company_name || ''

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: fullName,
        phone,
        company_name: companyName,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Failed to ensure OAuth user profile:', profileError)
    }
  }

  return response
}
