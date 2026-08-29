  'use client'

  import { Suspense, useState } from 'react'
  import { useRouter, useSearchParams } from 'next/navigation'
  import Link from 'next/link'
  import BrandLogo from '@/components/BrandLogo'
  import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

  function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [companyName, setCompanyName] = useState('')
    // Deep-link support: /login?mode=signup opens the sign-up form directly.
    const [mode, setMode] = useState<'signin' | 'signup'>(
      searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
    )
    const [error, setError] = useState<string | null>(searchParams.get('error'))
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleGoogleSignIn() {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Add your credentials to .env.local.')
        return
      }
      setError(null)
      setMessage(null)
      setGoogleLoading(true)

      try {
        const supabase = createClient()
        const origin = window.location.origin
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        })
        if (error) {
          setError(error.message)
          setGoogleLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign in failed.')
        setGoogleLoading(false)
      }
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Add your credentials to .env.local.')
        return
      }
      const supabase = createClient()
      setError(null)
      setMessage(null)
      setLoading(true)

      try {
        if (mode === 'signin') {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) {
            setError(error.message)
          } else {
            router.push('/')
            router.refresh()
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              // Stored as user metadata; a DB trigger copies it into `profiles`.
              data: {
                full_name: fullName.trim(),
                phone: phone.trim(),
                company_name: companyName.trim(),
              },
            },
          })
          if (error) {
            setError(error.message)
          } else if (data.session) {
            // Email confirmation is disabled — the user is already signed in.
            // New accounts have no active subscription, so land on the paywall.
            router.push('/subscribe')
            router.refresh()
          } else {
            setMessage('Check your email for a confirmation link, then sign in to subscribe.')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="relative min-h-screen bg-gray-50">
        {/* Top Header Navigation: Back to Home Button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 hover:text-indigo-600 cursor-pointer"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            {/* Logo & Header */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <BrandLogo href="/welcome" />
              <p className="mt-1 text-center text-sm text-gray-500">
                {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
              </p>
            </div>

          {/* Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            {/* Mode Switcher Tabs */}
            <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  mode === 'signin'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  mode === 'signup'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60 shadow-2xs cursor-pointer"
            >
              {googleLoading ? (
                <svg className="h-5 w-5 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2.5 font-medium text-gray-400">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-gray-300 px-3.5 py-2 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3.5 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-lg bg-green-50 px-3.5 py-2 text-sm text-green-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-gray-500">
              <div>
                {mode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                      className="font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
                      className="font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
              <div className="pt-2 border-t border-gray-100 w-full">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Return to Home Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

  // useSearchParams() (read inside LoginForm) needs a Suspense boundary.
  export default function LoginPage() {
    return (
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    )
  }

