'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice, LineItem, Party, InvoiceStatus } from '@/types'
import { saveInvoice, nextInvoiceNumber } from '@/lib/storage'
import { generateId, today, daysFromNow, formatCurrency } from '@/lib/utils'

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

const defaultParty: Party = { name: '', email: '', address: '', phone: '' }

interface Props {
  mode: 'new' | 'edit'
  initialData?: Invoice
}

export default function InvoiceForm({ mode, initialData }: Props) {
  const router = useRouter()

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(daysFromNow(30))
  const [from, setFrom] = useState<Party>(defaultParty)
  const [to, setTo] = useState<Party>(defaultParty)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 },
  ])
  const [notes, setNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)

  const subtotal = lineItems.reduce((s, item) => s + item.amount, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  useEffect(() => {
    if (mode === 'new') {
      nextInvoiceNumber().then(setInvoiceNumber).catch(err => console.warn(err.message || 'Failed to generate number'))
    } else if (initialData) {
      setInvoiceNumber(initialData.invoiceNumber)
      setStatus(initialData.status)
      setIssueDate(initialData.issueDate)
      setDueDate(initialData.dueDate)
      setFrom(initialData.from)
      setTo(initialData.to)
      setLineItems(initialData.lineItems)
      setNotes(initialData.notes)
      setTaxRate(initialData.taxRate)
    }
  }, [mode, initialData])

  function updateLineItem(
    id: string,
    field: keyof LineItem,
    rawValue: string,
  ) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const value =
          field === 'quantity' || field === 'rate'
            ? parseFloat(rawValue) || 0
            : rawValue
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate)
        }
        return updated
      }),
    )
  }

  function addLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 },
    ])
  }

  function removeLineItem(id: string) {
    setLineItems(prev =>
      prev.length > 1 ? prev.filter(item => item.id !== id) : prev,
    )
  }

  async function handleSave() {
    const now = new Date().toISOString()
    const invoice: Invoice = {
      id: initialData?.id ?? generateId(),
      invoiceNumber,
      status,
      issueDate,
      dueDate,
      from,
      to,
      lineItems,
      notes,
      taxRate,
      subtotal,
      tax,
      total,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      await saveInvoice(invoice)
      router.push(`/invoices/${invoice.id}`)
    } catch (error: any) {
      console.warn("Failed to save invoice:", error.message || error)
      if (error.message === 'Not authenticated') {
        alert("You must be logged in to save an invoice.")
        router.push('/login')
      } else {
        alert(`Error saving invoice: ${error.message || "Unknown error"}`)
      }
    }
  }

  function handleCancel() {
    if (mode === 'edit' && initialData) {
      router.push(`/invoices/${initialData.id}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'new' ? 'New Invoice' : `Edit ${invoiceNumber}`}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Save Invoice
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice details */}
        <Section title="Invoice Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as InvoiceStatus)}
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        {/* From / To */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PartySection
            title="From (Your Business)"
            party={from}
            onChange={setFrom}
            inputCls={inputCls}
            labelCls={labelCls}
          />
          <PartySection
            title="Bill To (Client)"
            party={to}
            onChange={setTo}
            inputCls={inputCls}
            labelCls={labelCls}
          />
        </div>

        {/* Line items */}
        <Section title="Line Items">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>
                  <th className="w-20 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>
                  <th className="w-32 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate (₹)
                  </th>
                  <th className="w-32 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>
                  <th className="w-8 pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 pr-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e =>
                          updateLineItem(item.id, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        className={inputCls}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e =>
                          updateLineItem(item.id, 'quantity', e.target.value)
                        }
                        min="0"
                        className={`${inputCls} text-right`}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={e =>
                          updateLineItem(item.id, 'rate', e.target.value)
                        }
                        min="0"
                        step="0.01"
                        className={`${inputCls} text-right`}
                      />
                    </td>
                    <td className="py-3 pr-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="text-gray-300 transition-colors hover:text-red-500 disabled:cursor-not-allowed"
                        aria-label="Remove line item"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile item cards */}
          <div className="space-y-4 sm:hidden">
            {lineItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">
                    Item {idx + 1}
                  </span>
                  <button
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="text-gray-300 transition-colors hover:text-red-500 disabled:cursor-not-allowed"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={e =>
                    updateLineItem(item.id, 'description', e.target.value)
                  }
                  placeholder="Description"
                  className={`${inputCls} mb-2`}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e =>
                        updateLineItem(item.id, 'quantity', e.target.value)
                      }
                      min="0"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Rate</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={e =>
                        updateLineItem(item.id, 'rate', e.target.value)
                      }
                      min="0"
                      step="0.01"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Amount</label>
                    <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addLineItem}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Line Item
          </button>
        </Section>

        {/* Notes + Totals */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Payment terms, bank details, or any other notes..."
              className={`${inputCls} resize-none`}
            />
          </Section>

          <Section title="Summary">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  Tax (%)
                  <input
                    type="number"
                    value={taxRate}
                    onChange={e =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <span className="font-medium text-gray-900">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </Section>
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h2>
      {children}
    </div>
  )
}

function PartySection({
  title,
  party,
  onChange,
  inputCls,
  labelCls,
}: {
  title: string
  party: Party
  onChange: (p: Party) => void
  inputCls: string
  labelCls: string
}) {
  function set(field: keyof Party, value: string) {
    onChange({ ...party, [field]: value })
  }

  return (
    <Section title={title}>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Name / Company</label>
          <input
            type="text"
            value={party.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Acme Corp"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={party.email}
            onChange={e => set('email', e.target.value)}
            placeholder="hello@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <textarea
            value={party.address}
            onChange={e => set('address', e.target.value)}
            rows={2}
            placeholder="123 Main St, City, Country"
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={party.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputCls}
          />
        </div>
      </div>
    </Section>
  )
}
