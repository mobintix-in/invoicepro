'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getMySubscription, submitPayment } from '@/lib/account'
import { SUBSCRIPTION, upiPaymentUri, type Subscription } from '@/lib/subscription'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

export default function SubscribePage() {
  const router = useRouter()
  // Start "loading" only when we actually have a backend to query.
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [sub, setSub] = useState<Subscription | null>(null)
  const [utr, setUtr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setSub(await getMySubscription())
    setLoading(false)
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getMySubscription().then((s) => {
      setSub(s)
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (utr.trim().length < 6) {
      setError('Please enter the UPI transaction / UTR reference from your payment.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await submitPayment(utr)
      setUtr('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    if (isSupabaseConfigured()) await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const status = sub?.status ?? 'none'
  const canPay = status === 'none' || status === 'rejected' || status === 'expired'

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">InvoicePro Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">
          A monthly subscription is required to access your invoices.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : status === 'active' ? (
          <StateActive expiresAt={sub?.expiresAt ?? null} />
        ) : status === 'pending' ? (
          <StatePending utr={sub?.utr ?? null} onRefresh={refresh} />
        ) : (
          <PayFlow
            rejected={status === 'rejected'}
            expired={status === 'expired'}
            utr={utr}
            setUtr={setUtr}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="mx-auto mt-6 text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        Sign out
      </button>
      {!canPay ? null : (
        <p className="mt-4 text-center text-xs text-gray-400">
          Paying to <span className="font-medium text-gray-500">{SUBSCRIPTION.upiId}</span>. After we
          confirm your payment your account is activated for {SUBSCRIPTION.planMonths} month.
        </p>
      )}
    </main>
  )
}

function StateActive({ expiresAt }: { expiresAt: string | null }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">Subscription active</h2>
      <p className="mt-1 text-sm text-gray-500">Valid until {formatDate(expiresAt)}.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Go to your invoices
      </Link>
    </div>
  )
}

function StatePending({ utr, onRefresh }: { utr: string | null; onRefresh: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">Payment under review</h2>
      <p className="mt-1 text-sm text-gray-500">
        We received your reference{utr ? <> (<span className="font-medium text-gray-700">{utr}</span>)</> : null} and
        will activate your account once the payment is verified.
      </p>
      <button
        onClick={onRefresh}
        className="mt-6 inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Refresh status
      </button>
    </div>
  )
}

function PayFlow({
  rejected,
  expired,
  utr,
  setUtr,
  onSubmit,
  submitting,
  error,
}: {
  rejected: boolean
  expired: boolean
  utr: string
  setUtr: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  error: string | null
}) {
  return (
    <div>
      {rejected && (
        <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          Your previous payment could not be verified. Please pay again and re-submit the reference.
        </p>
      )}
      {expired && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          Your subscription has expired. Renew below to restore access.
        </p>
      )}

      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-500">Amount due</div>
        <div className="text-3xl font-bold text-gray-900">
          ₹{SUBSCRIPTION.priceInr}
          <span className="text-base font-medium text-gray-400"> / month</span>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 p-4">
          <QRCodeSVG value={upiPaymentUri()} size={188} level="M" marginSize={2} />
        </div>
        <p className="mt-3 text-center text-sm text-gray-500">
          Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay
          <span className="font-medium text-gray-700"> ₹{SUBSCRIPTION.priceInr}</span> to
          <span className="font-medium text-gray-700"> {SUBSCRIPTION.upiId}</span>.
        </p>
      </div>

      <div className="my-6 border-t border-gray-200" />

      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="utr" className="block text-sm font-medium text-gray-700">
          After paying, enter the UPI transaction / UTR reference
        </label>
        <input
          id="utr"
          type="text"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="e.g. 4501 2233 4455"
          className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit payment for verification'}
        </button>
        <p className="text-center text-xs text-gray-400">
          You&apos;ll get access as soon as we confirm the transfer.
        </p>
      </form>
    </div>
  )
}
