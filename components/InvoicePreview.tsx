'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Invoice, InvoiceStatus, Party } from '@/types'
import { getInvoice, saveInvoice, deleteInvoice } from '@/lib/storage'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

export default function InvoicePreview({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    getInvoice(id).then(inv => {
      if (!inv) {
        router.replace('/')
        return
      }
      setInvoice(inv)
    })
  }, [id, router])

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  async function updateStatus(newStatus: InvoiceStatus) {
    if (!invoice) return
    const updated: Invoice = {
      ...invoice,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }
    await saveInvoice(updated)
    setInvoice(updated)
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete invoice ${invoice?.invoiceNumber}? This cannot be undone.`,
      )
    )
      return
    await deleteInvoice(id)
    router.push('/')
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Action bar – hidden when printing */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
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
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Print / PDF
          </button>
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

      {/* Invoice document */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              INVOICE
            </h1>
            <div className="mt-3">
              <StatusBadge status={invoice.status} size="md" />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-500">Issued:</span>{' '}
                {formatDate(invoice.issueDate)}
              </div>
              <div>
                <span className="font-medium text-gray-500">Due:</span>{' '}
                {formatDate(invoice.dueDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="my-8 border-t border-gray-200" />

        {/* From / To */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              From
            </div>
            <PartyBlock party={invoice.from} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Bill To
            </div>
            <PartyBlock party={invoice.to} />
          </div>
        </div>

        <div className="my-8 border-t border-gray-200" />

        {/* Line items */}
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </th>
              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Qty
              </th>
              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Rate
              </th>
              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.lineItems.map(item => (
              <tr key={item.id}>
                <td className="py-3 pr-4 text-sm text-gray-800">
                  {item.description || (
                    <span className="italic text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right text-sm text-gray-700">
                  {item.quantity}
                </td>
                <td className="py-3 pr-4 text-right text-sm text-gray-700">
                  {formatCurrency(item.rate)}
                </td>
                <td className="py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full space-y-2 sm:w-72">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.tax)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-900 pt-3">
              <span className="text-base font-bold text-gray-900">
                Total Due
              </span>
              <span className="text-2xl font-black text-gray-900">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <>
            <div className="my-8 border-t border-gray-200" />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Notes
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {invoice.notes}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PartyBlock({ party }: { party: Party }) {
  const hasContent =
    party.name || party.email || party.address || party.phone
  if (!hasContent) {
    return <span className="text-sm italic text-gray-400">Not specified</span>
  }
  return (
    <div className="space-y-0.5 text-sm">
      {party.name && (
        <div className="font-semibold text-gray-900">{party.name}</div>
      )}
      {party.email && <div className="text-gray-600">{party.email}</div>}
      {party.address && (
        <div className="whitespace-pre-wrap text-gray-600">{party.address}</div>
      )}
      {party.phone && <div className="text-gray-600">{party.phone}</div>}
    </div>
  )
}
