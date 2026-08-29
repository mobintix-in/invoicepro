'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getMyProfile, updateMyProfile, getMySubscription, type ProfileInput } from '@/lib/account'
import { isSubscriptionActive, type Subscription, type SubscriptionStatus } from '@/lib/subscription'
import InvoiceThemePicker from '@/components/InvoiceThemePicker'

const inputCls =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
const labelCls = 'block text-sm font-medium text-gray-700'

const EMPTY: ProfileInput = {
  fullName: '',
  phone: '',
  companyName: '',
  address: '',
  gstin: '',
  stateName: '',
  stateCode: '',
  pan: '',
  bankAccountName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  bankBranch: '',
  jurisdiction: '',
  defaultInvoiceNotes: '',
  upiId: '',
  invoiceTheme: 'indigo',
  template: 'classic',
}

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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [form, setForm] = useState<ProfileInput>(EMPTY)
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    Promise.all([getMyProfile(), getMySubscription()]).then(([p, s]) => {
      if (p) {
        setForm({
          fullName: p.fullName,
          phone: p.phone,
          companyName: p.companyName,
          address: p.address,
          gstin: p.gstin,
          stateName: p.stateName,
          stateCode: p.stateCode,
          pan: p.pan,
          bankAccountName: p.bankAccountName,
          bankName: p.bankName,
          accountNumber: p.accountNumber,
          ifscCode: p.ifscCode,
          bankBranch: p.bankBranch,
          jurisdiction: p.jurisdiction,
          defaultInvoiceNotes: p.defaultInvoiceNotes,
          upiId: p.upiId,
          invoiceTheme: p.invoiceTheme || 'indigo',
          template: p.template || 'classic',
        })
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
      await updateMyProfile(form)
      setMessage('Profile saved. New invoices will use these details.')
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your business details here auto-fill the "From" side of every new invoice.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account */}
        <Section title="Account">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className={labelCls}>Full Name</label>
              <input id="fullName" type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>Phone Number</label>
              <input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" value={email} disabled className={`${inputCls} cursor-not-allowed bg-gray-50 text-gray-500`} />
              <p className="mt-1 text-xs text-gray-400">Email is tied to your login and can&apos;t be changed here.</p>
            </div>
          </div>
        </Section>

        {/* Business details */}
        <Section title="Business details" hint={'Shown as the seller (\u201cFrom\u201d) on your invoices.'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="companyName" className={labelCls}>Company / Business Name</label>
              <input id="companyName" type="text" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Chamunda Bricks" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelCls}>Address</label>
              <textarea id="address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, City, State" className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="gstin" className={labelCls}>GSTIN / UIN</label>
              <input id="gstin" type="text" value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="24AVJPP1377R1ZT" className={inputCls} />
            </div>
            <div>
              <label htmlFor="pan" className={labelCls}>PAN</label>
              <input id="pan" type="text" value={form.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" className={inputCls} />
            </div>
            <div>
              <label htmlFor="stateName" className={labelCls}>State Name</label>
              <input id="stateName" type="text" value={form.stateName} onChange={(e) => set('stateName', e.target.value)} placeholder="Gujarat" className={inputCls} />
            </div>
            <div>
              <label htmlFor="stateCode" className={labelCls}>State Code</label>
              <input id="stateCode" type="text" value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)} placeholder="24" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="jurisdiction" className={labelCls}>Jurisdiction City</label>
              <input id="jurisdiction" type="text" value={form.jurisdiction} onChange={(e) => set('jurisdiction', e.target.value)} placeholder="Surat" className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Bank details + UPI */}
        <Section title="Bank details & UPI" hint="Appears on invoices for payment. Add your UPI ID to auto-generate a QR code in the PDF.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bankAccountName" className={labelCls}>A/c Holder Name</label>
              <input id="bankAccountName" type="text" value={form.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} placeholder="CHAMUNDA BRICKS" className={inputCls} />
            </div>
            <div>
              <label htmlFor="bankName" className={labelCls}>Bank Name</label>
              <input id="bankName" type="text" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="BANK OF BARODA" className={inputCls} />
            </div>
            <div>
              <label htmlFor="accountNumber" className={labelCls}>Account Number</label>
              <input id="accountNumber" type="text" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} placeholder="44850200000036" className={inputCls} />
            </div>
            <div>
              <label htmlFor="ifscCode" className={labelCls}>IFSC Code</label>
              <input id="ifscCode" type="text" value={form.ifscCode} onChange={(e) => set('ifscCode', e.target.value.toUpperCase())} placeholder="BARB0MAHSUR" className={inputCls} />
            </div>
            <div>
              <label htmlFor="bankBranch" className={labelCls}>Branch</label>
              <input id="bankBranch" type="text" value={form.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} placeholder="MAHUVA" className={inputCls} />
            </div>
            <div>
              <label htmlFor="upiId" className={labelCls}>
                UPI ID
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                  ✦ Auto QR in PDF
                </span>
              </label>
              <input
                id="upiId"
                type="text"
                value={form.upiId}
                onChange={(e) => set('upiId', e.target.value)}
                placeholder="yourname@paytm"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">
                A scannable UPI QR code will appear in the payment section of every PDF you generate.
              </p>
            </div>
          </div>
        </Section>

        {/* Invoice Theme & Template */}
        <Section
          title="Invoice Layout Template & Style"
          hint="Select your invoice structural design and accent color. Applied across all your invoices."
        >
          <InvoiceThemePicker
            selectedTemplate={form.template || 'classic'}
            selectedTheme={form.invoiceTheme || 'indigo'}
            onTemplateChange={(tmpl) => set('template', tmpl)}
            onThemeChange={(th) => set('invoiceTheme', th)}
          />
        </Section>

        {/* Invoice defaults */}
        <Section
          title="Invoice defaults"
          hint="These notes are copied automatically into every new invoice. Existing invoices keep their own notes."
        >
          <div>
            <label htmlFor="defaultInvoiceNotes" className={labelCls}>Default invoice notes</label>
            <textarea
              id="defaultInvoiceNotes"
              rows={5}
              value={form.defaultInvoiceNotes}
              onChange={(e) => set('defaultInvoiceNotes', e.target.value)}
              placeholder={'Payment due within 15 days.\nGoods once sold will not be taken back.\nThank you for your business.'}
              className={inputCls + ' resize-y'}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              You can still change or remove these notes on an individual invoice.
            </p>
          </div>
        </Section>

        {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">{message}</p>}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Member since {formatDate(createdAt)}</span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
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
