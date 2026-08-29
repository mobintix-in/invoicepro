'use client'

import { useState, useEffect } from 'react'
import { useRouter, notFound } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Invoice, InvoiceStatus } from '@/types'
import { getInvoice, updateInvoice, deleteInvoice } from '@/lib/storage'
import { getMyProfile, updateMyProfile } from '@/lib/account'

const InvoicePDFButton = dynamic(() => import('@/components/InvoicePDFButton'), { ssr: false })
const InvoicePDFPreview = dynamic(() => import('@/components/InvoicePDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24 shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  ),
})

const TEMPLATES = [
  { id: 'classic', label: 'Classic GST' },
  { id: 'modern', label: 'Modern Minimal' },
  { id: 'corporate', label: 'Corporate Banner' },
  { id: 'compact', label: 'Compact Ledger' },
]

const THEMES = [
  { id: 'indigo', color: '#4F46E5' },
  { id: 'violet', color: '#7C3AED' },
  { id: 'blue', color: '#2563EB' },
  { id: 'emerald', color: '#059669' },
  { id: 'teal', color: '#0D9488' },
  { id: 'rose', color: '#E11D48' },
  { id: 'slate', color: '#334155' },
]

export default function InvoicePreview({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [missing, setMissing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    getInvoice(id)
      .then(async (inv) => {
        if (!inv) {
          setMissing(true)
          return
        }

        // Apply profile defaults for template & theme if missing
        try {
          const profile = await getMyProfile()
          if (profile) {
            if (!inv.template && profile.template) inv.template = profile.template
            if (!inv.invoiceTheme && profile.invoiceTheme) inv.invoiceTheme = profile.invoiceTheme
            if (!inv.upiId && profile.upiId) inv.upiId = profile.upiId
          }
        } catch {}

        setInvoice({ ...inv })
      })
      .catch(() => {
        setLoadError('Could not load this invoice. Please check your connection and try again.')
      })
  }, [id])

  if (missing) notFound()

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  async function handleTemplateChange(newTemplate: string) {
    if (!invoice) return
    const updated = { ...invoice, template: newTemplate, updatedAt: new Date().toISOString() }
    setInvoice(updated)
    try {
      await updateInvoice(updated)
      if (typeof window !== 'undefined') localStorage.setItem('invoice_template', newTemplate)
    } catch {}
  }

  async function handleThemeChange(newTheme: string) {
    if (!invoice) return
    const updated = { ...invoice, invoiceTheme: newTheme, updatedAt: new Date().toISOString() }
    setInvoice(updated)
    try {
      await updateInvoice(updated)
      if (typeof window !== 'undefined') localStorage.setItem('invoice_theme', newTheme)
    } catch {}
  }

  async function updateStatus(newStatus: InvoiceStatus) {
    if (!invoice) return
    const updated: Invoice = {
      ...invoice,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }
    try {
      await updateInvoice(updated)
      setInvoice(updated)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn("Failed to update status:", msg)
      if (msg === 'Not authenticated') {
        alert("You must be logged in to update an invoice.")
        router.push('/login')
      } else {
        alert(`Error updating invoice: ${msg || "Unknown error"}`)
      }
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete invoice ${invoice?.invoiceNumber}? This cannot be undone.`,
      )
    )
      return
    try {
      await deleteInvoice(id)
      router.push('/')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn("Failed to delete invoice:", msg)
      if (msg === 'Not authenticated') {
        alert("You must be logged in to delete an invoice.")
        router.push('/login')
      } else {
        alert(`Error deleting invoice: ${msg || "Unknown error"}`)
      }
    }
  }

  const currentTemplate = (invoice.template || 'classic').toLowerCase()
  const currentTheme = invoice.invoiceTheme || 'indigo'

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          All Invoices
        </Link>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <button
              onClick={() => updateStatus('paid')}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Mark as Paid
            </button>
          )}
          {invoice.status === 'draft' && (
            <button
              onClick={() => updateStatus('sent')}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Mark as Sent
            </button>
          )}
          <InvoicePDFButton invoice={invoice} />
          <Link
            href={`/invoices/${id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Live Structural Template & Accent Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1.5">Template:</span>
          {TEMPLATES.map((tmpl) => {
            const active = currentTemplate === tmpl.id
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tmpl.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">Color:</span>
          {THEMES.map((th) => {
            const active = currentTheme === th.id
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => handleThemeChange(th.id)}
                className={`h-5 w-5 rounded-full transition-transform ${
                  active ? 'scale-125 ring-2 ring-gray-900 ring-offset-1' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: th.color }}
              />
            )
          })}
        </div>
      </div>

      {/* On-screen preview */}
      <InvoicePDFPreview invoice={invoice} />
    </div>
  )
}
