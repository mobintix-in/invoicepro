'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getMySubscription } from '@/lib/account'
import {
  SUBSCRIPTION,
  createUpiPaymentReference,
  googlePayIntentUri,
  upiPaymentUri,
  isSubscriptionActive,
  type Subscription,
} from '@/lib/subscription'
import { listActivePackages } from '@/lib/packages-admin'
import { type Package } from '@/lib/packages'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

export default function SubscribePage() {
  const router = useRouter()
  // Start "loading" only when we actually have a backend to query.
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [sub, setSub] = useState<Subscription | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setSub(await getMySubscription())
    } catch {
      setError('Could not refresh your subscription status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    Promise.all([getMySubscription(), listActivePackages()])
      .then(([subscription, availablePackages]) => {
        setSub(subscription)
        setPackages(availablePackages)
        const preferred =
          availablePackages.find((plan) => plan.highlighted) ??
          availablePackages[0]
        if (preferred) {
          setSelectedKey(preferred.key)
          setPaymentReference(createUpiPaymentReference(preferred.key))
        }
        else setError('No subscription plans are currently available.')
      })
      .catch(() => setError('Could not load subscription details. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedPackage = packages.find((p) => p.key === selectedKey) ?? null
  const amountDue = selectedPackage?.priceInr ?? SUBSCRIPTION.priceInr

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      await createClient().auth.signOut({ scope: 'local' })
    }
    router.push('/login')
    router.refresh()
  }

  const status =
    sub?.status === 'active' && !isSubscriptionActive(sub)
      ? 'expired'
      : (sub?.status ?? 'none')
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
            packages={packages}
            selectedKey={selectedKey}
            onSelectKey={(key) => {
              setSelectedKey(key)
              setPaymentReference(createUpiPaymentReference(key))
            }}
            paymentReference={paymentReference}
            amountDue={amountDue}
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
  packages,
  selectedKey,
  onSelectKey,
  paymentReference,
  amountDue,
  error,
}: {
  rejected: boolean
  expired: boolean
  packages: Package[]
  selectedKey: string
  onSelectKey: (key: string) => void
  paymentReference: string
  amountDue: number
  error: string | null
}) {
  const paymentNote = `InvoicePro ${selectedKey || 'subscription'} plan`
  const directUpiUri = paymentReference
    ? upiPaymentUri(amountDue, paymentNote, paymentReference)
    : ''

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

      {packages.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-gray-700">Choose your plan</div>
          <div className="space-y-2">
            {packages.map((p) => {
              const active = p.key === selectedKey
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onSelectKey(p.key)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      {p.highlighted && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{p.tagline}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-gray-900">₹{p.priceInr.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-gray-400">/ month</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-500">Amount due</div>
        <div className="text-3xl font-bold text-gray-900">
          ₹{amountDue.toLocaleString('en-IN')}
          <span className="text-base font-medium text-gray-400"> / month</span>
        </div>

        {directUpiUri && (
          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
            <QRCodeSVG value={directUpiUri} size={188} level="M" marginSize={2} />
          </div>
        )}
        <p className="mt-3 text-center text-sm text-gray-500">
          Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay
          <span className="font-medium text-gray-700"> ₹{amountDue.toLocaleString('en-IN')}</span> to
          <span className="font-medium text-gray-700"> {SUBSCRIPTION.upiId}</span>.
        </p>
        {paymentReference && (
          <p className="mt-1 text-center text-xs text-gray-400">
            Payment reference: {paymentReference}
          </p>
        )}
        {directUpiUri && (
          <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={googlePayIntentUri(directUpiUri)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Pay with Google Pay
            </a>
            <a
              href={directUpiUri}
              className="inline-flex items-center justify-center rounded-lg border border-indigo-300 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Open any UPI app
            </a>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-gray-400">
          On a computer, scan the QR. On Android, use either payment button.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
