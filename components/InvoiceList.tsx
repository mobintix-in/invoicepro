'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Invoice, InvoiceStatus } from '@/types'
import { INVOICE_TYPES, getInvoiceTypeDefinition } from '@/types'
import { getInvoices } from '@/lib/storage'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

type Filter = 'all' | InvoiceStatus

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [mounted, setMounted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .catch(() => setLoadError('Could not load invoices. Please check your connection and try again.'))
      .finally(() => setMounted(true))
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  const filtered = invoices.filter(inv => {
    const matchesStatus = filter === 'all' || inv.status === filter
    const matchesType = typeFilter === 'all' || (inv.invoiceType || 'tax_invoice') === typeFilter
    return matchesStatus && matchesType
  })

  const stats = {
    count: invoices.length,
    total: invoices.reduce((s, inv) => s + (inv.total || 0), 0),
    paid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((s, inv) => s + (inv.total || 0), 0),
    outstanding: invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((s, inv) => s + (inv.total || 0), 0),
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Invoices"
          value={String(stats.count)}
          subtext="Total documents"
          icon={
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          iconBg="bg-indigo-50 ring-1 ring-indigo-200/50"
        />
        <StatCard
          label="Total Value"
          value={formatCurrency(stats.total)}
          subtext="Invoiced volume"
          icon={
            <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-slate-100 ring-1 ring-slate-200"
        />
        <StatCard
          label="Paid"
          value={formatCurrency(stats.paid)}
          valueClass="text-emerald-600"
          subtext="Collected revenue"
          icon={
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-emerald-50 ring-1 ring-emerald-200/60"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          valueClass="text-amber-600"
          subtext="Sent or overdue"
          icon={
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-amber-50 ring-1 ring-amber-200/60"
        />
      </div>

      {/* Filter tabs and Type selector */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filters - Equal pill alignment */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Invoice status filters">
          {filterOptions.map(f => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all outline-none focus:outline-none ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                    active
                      ? 'bg-indigo-500/80 text-white'
                      : f.count > 0
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Invoice Type dropdown filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500">
            Type:
          </label>
          <div className="relative">
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 w-48 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Document Types</option>
              {INVOICE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div>
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs md:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/75">
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Invoice
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Type
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Client
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Issue Date
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                        Due Date
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                        Amount
                      </th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtered.map(inv => {
                      const typeDef = getInvoiceTypeDefinition(inv.invoiceType)
                      return (
                        <tr
                          key={inv.id}
                          className="transition-colors hover:bg-slate-50/75"
                        >
                          {/* Invoice Number */}
                          <td className="px-5 py-4">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="font-bold text-slate-900 transition-colors hover:text-indigo-600"
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </td>

                          {/* Dedicated Document Type Column */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold leading-none ${typeDef.badgeClass}`}
                            >
                              {typeDef.shortLabel}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="px-4 py-4 text-sm font-medium text-slate-700">
                            {inv.to.name ? (
                              <span className="truncate block max-w-[180px]">{inv.to.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">No client</span>
                            )}
                          </td>

                          {/* Issue Date */}
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-500">
                            {formatDate(inv.issueDate)}
                          </td>

                          {/* Due Date */}
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-500">
                            {formatDate(inv.dueDate)}
                          </td>

                          {/* Amount (Right aligned) */}
                          <td className="px-4 py-4 text-right text-sm font-bold tabular-nums text-slate-900 whitespace-nowrap">
                            {formatCurrency(inv.total)}
                          </td>

                          {/* Status Badge (Center aligned) */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <StatusBadge status={inv.status} />
                          </td>

                          {/* Actions (Right aligned) */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3 text-xs">
                              <Link
                                href={`/invoices/${inv.id}/edit`}
                                className="font-semibold text-slate-500 transition-colors hover:text-slate-900"
                              >
                                Edit
                              </Link>
                              <Link
                                href={`/invoices/${inv.id}`}
                                className="inline-flex items-center font-bold text-indigo-600 transition-colors hover:text-indigo-800"
                              >
                                View →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards (Phones / small tablets) */}
            <div className="space-y-3 md:hidden">
              {filtered.map(inv => {
                const typeDef = getInvoiceTypeDefinition(inv.invoiceType)
                return (
                  <div
                    key={inv.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold leading-none ${typeDef.badgeClass}`}
                        >
                          {typeDef.shortLabel}
                        </span>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {inv.to.name || <span className="text-slate-400 italic">No client specified</span>}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Due date</div>
                        <div className="text-xs font-semibold text-slate-600">{formatDate(inv.dueDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total</div>
                        <div className="text-base font-bold tabular-nums text-slate-900">{formatCurrency(inv.total)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-3 border-t border-slate-100 pt-2.5 text-xs">
                      <Link
                        href={`/invoices/${inv.id}/edit`}
                        className="font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                )
              })}
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
  subtext,
  icon,
  iconBg,
  valueClass = 'text-slate-900',
}: {
  label: string
  value: string
  subtext?: string
  icon?: React.ReactNode
  iconBg?: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg || 'bg-slate-100'}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <div className={`truncate text-2xl font-black tracking-tight tabular-nums ${valueClass}`}>
          {value}
        </div>
        {subtext && <div className="mt-0.5 text-xs font-medium text-slate-400">{subtext}</div>}
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">
        {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices found`}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {filter === 'all'
          ? 'Get started by creating your first invoice, quotation, or bill of supply.'
          : `There are currently no documents marked as ${filter}.`}
      </p>
      {filter === 'all' && (
        <Link
          href="/invoices/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create First Invoice
        </Link>
      )}
    </div>
  )
}
