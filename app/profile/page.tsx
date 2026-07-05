'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getMyProfile, updateMyProfile, getMySubscription } from '@/lib/account'
import { isSubscriptionActive, type Subscription, type SubscriptionStatus } from '@/lib/subscription'

const inputCls =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
const labelCls = 'block text-sm font-medium text-gray-700'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

const STATUS_STYLES: Record<SubscriptionStatus | 'none', string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-200 text-gray-600',
  none: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<SubscriptionStatus | 'none', string> = {
  active: 'Active',
  pending: 'Pending review',
  rejected: 'Rejected',
  expired: 'Expired',
  none: 'No subscription',
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    Promise.all([getMyProfile(), getMySubscription()]).then(([p, s]) => {
      if (p) {
        setFullName(p.fullName)
        setCompanyName(p.companyName)
        setPhone(p.phone)
        setEmail(p.email)
        setCreatedAt(p.createdAt)
      }
      setSub(s)
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await updateMyProfile({ fullName, phone, companyName })
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </main>
    )
  }

  const status: SubscriptionStatus | 'none' = sub?.status ?? 'none'
  const active = isSubscriptionActive(sub)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account details.</p>
      </div>

      {/* Account details */}
      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Account details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className={labelCls}>Full Name</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="companyName" className={labelCls}>Company Name</label>
            <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone Number</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" type="email" value={email} disabled className={`${inputCls} cursor-not-allowed bg-gray-50 text-gray-500`} />
            <p className="mt-1 text-xs text-gray-400">Email is tied to your login and can&apos;t be changed here.</p>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">{message}</p>}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-gray-400">Member since {formatDate(createdAt)}</span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Subscription */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Subscription</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            {active && sub?.expiresAt && (
              <span className="text-sm text-gray-500">Valid until {formatDate(sub.expiresAt)}</span>
            )}
          </div>
          <Link
            href="/subscribe"
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {active ? 'View subscription' : 'Subscribe'}
          </Link>
        </div>
      </div>
    </main>
  )
}
