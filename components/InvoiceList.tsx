'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Invoice, InvoiceStatus } from '@/types'
import { getInvoices } from '@/lib/storage'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

type Filter = 'all' | InvoiceStatus

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .finally(() => setMounted(true))
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  const filtered =
    filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter)

  const stats = {
    count: invoices.length,
    total: invoices.reduce((s, inv) => s + inv.total, 0),
    paid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((s, inv) => s + inv.total, 0),
    outstanding: invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((s, inv) => s + inv.total, 0),
  }

  const filterOptions: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: invoices.length },
    {
      value: 'draft',
      label: 'Draft',
      count: invoices.filter(i => i.status === 'draft').length,
    },
    {
      value: 'sent',
      label: 'Sent',
      count: invoices.filter(i => i.status === 'sent').length,
    },
    {
      value: 'paid',
      label: 'Paid',
      count: invoices.filter(i => i.status === 'paid').length,
    },
    {
      value: 'overdue',
      label: 'Overdue',
      count: invoices.filter(i => i.status === 'overdue').length,
    },
  ]

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoices" value={String(stats.count)} />
        <StatCard label="Total Value" value={formatCurrency(stats.total)} />
        <StatCard
          label="Paid"
          value={formatCurrency(stats.paid)}
          valueClass="text-green-600"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          valueClass="text-orange-600"
        />
      </div>

      {/* Filter tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="flex gap-x-2 overflow-x-auto" aria-label="Invoice filters">
          {filterOptions.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    filter === f.value
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* List */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Invoice',
                      'Client',
                      'Issue Date',
                      'Due Date',
                      'Amount',
                      'Status',
                      '',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(inv => (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {inv.to.name || <span className="text-gray-400 italic">No client</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/invoices/${inv.id}/edit`}
                          className="mr-3 text-xs text-gray-400 hover:text-indigo-600"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filtered.map(inv => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {inv.invoiceNumber}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="mt-1.5 text-sm text-gray-600">
                    {inv.to.name || (
                      <span className="italic text-gray-400">No client</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(inv.total)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Due {formatDate(inv.dueDate)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`mt-2 truncate text-2xl font-bold ${valueClass}`}>
        {value}
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {filter === 'all'
          ? 'Create your first invoice to get started.'
          : `You don't have any ${filter} invoices.`}
      </p>
      {filter === 'all' && (
        <Link
          href="/invoices/new"
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Create Invoice
        </Link>
      )}
    </div>
  )
}
