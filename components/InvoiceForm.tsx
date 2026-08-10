'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice, LineItem, Party, InvoiceStatus } from '@/types'
import { createInvoice, updateInvoice, nextInvoiceNumber, getInvoiceQuota, type InvoiceQuota } from '@/lib/storage'
import { getMyProfile } from '@/lib/account'
import { listClients, saveClient, type Client } from '@/lib/clients'
import { parseGstin, lookupGstin } from '@/lib/gstin'
import { generateId, today, daysFromNow, formatCurrency, roundMoney } from '@/lib/utils'

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

function databaseErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const value = error as {
      code?: unknown
      message?: unknown
      details?: unknown
      hint?: unknown
    }
    return [
      value.code ? `[${String(value.code)}]` : '',
      value.message ? String(value.message) : '',
      value.details ? String(value.details) : '',
      value.hint ? `Hint: ${String(value.hint)}` : '',
    ]
      .filter(Boolean)
      .join(' — ')
  }
  return String(error || 'Unknown database error')
}

const defaultParty: Party = { name: '', email: '', address: '', phone: '', gstin: '', stateName: '', stateCode: '' }

interface Props {
  mode: 'new' | 'edit'
  initialData?: Invoice
}

export default function InvoiceForm({ mode, initialData }: Props) {
  const router = useRouter()

  // Edit mode mounts with initialData already loaded, so initialize from it
  // directly (lazily). New mode starts blank and is pre-filled from the profile
  // in the effect below.
  const [invoiceNumber, setInvoiceNumber] = useState(() => initialData?.invoiceNumber ?? '')
  const [status, setStatus] = useState<InvoiceStatus>(() => initialData?.status ?? 'draft')
  const [issueDate, setIssueDate] = useState(() => initialData?.issueDate ?? today())
  const [dueDate, setDueDate] = useState(() => initialData?.dueDate ?? daysFromNow(30))
  const [from, setFrom] = useState<Party>(() => initialData?.from ?? defaultParty)
  const [to, setTo] = useState<Party>(() => initialData?.to ?? defaultParty)
  const [lineItems, setLineItems] = useState<LineItem[]>(() =>
    initialData?.lineItems ?? [
      { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0, hsnCode: '', unit: 'Units' },
    ],
  )
  const [notes, setNotes] = useState(() => initialData?.notes ?? '')
  const [taxRate, setTaxRate] = useState(() => initialData?.taxRate ?? 0)
  const [gstType, setGstType] = useState<'cgst_sgst' | 'igst'>(() => initialData?.gstType ?? 'cgst_sgst')
  const [sellerPan, setSellerPan] = useState(() => initialData?.sellerPan ?? '')
  const [bankAccountName, setBankAccountName] = useState(() => initialData?.bankAccountName ?? '')
  const [bankName, setBankName] = useState(() => initialData?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(() => initialData?.accountNumber ?? '')
  const [ifscCode, setIfscCode] = useState(() => initialData?.ifscCode ?? '')
  const [bankBranch, setBankBranch] = useState(() => initialData?.bankBranch ?? '')
  const [jurisdiction, setJurisdiction] = useState(() => initialData?.jurisdiction ?? '')
  const [deliveryNote, setDeliveryNote] = useState(() => initialData?.deliveryNote ?? '')
  const [buyerOrderNo, setBuyerOrderNo] = useState(() => initialData?.buyerOrderNo ?? '')
  const [dispatchThrough, setDispatchThrough] = useState(() => initialData?.dispatchThrough ?? '')
  const [destination, setDestination] = useState(() => initialData?.destination ?? '')
  const [clients, setClients] = useState<Client[]>([])
  const [savingClient, setSavingClient] = useState(false)
  const [quota, setQuota] = useState<InvoiceQuota | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0))
  const tax = roundMoney(
    lineItems.reduce(
      (sum, item) => sum + roundMoney(item.amount * ((item.gstRate ?? taxRate) / 100)),
      0,
    ),
  )
  const total = roundMoney(subtotal + tax)

  // Saved clients power the "Bill To" quick-picker.
  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => setLoadError('Could not load your saved clients.'))
  }, [])

  // Fill every "Bill To" field from a saved client in one click.
  function applyClient(clientId: string) {
    const c = clients.find((x) => x.id === clientId)
    if (!c) return
    setTo({
      name: c.name,
      email: c.email,
      address: c.address,
      phone: c.phone,
      gstin: c.gstin,
      stateName: c.stateName,
      stateCode: c.stateCode,
    })
  }

  // Save whatever is currently typed in "Bill To" as a reusable client.
  async function saveToAsClient() {
    if (!to.name.trim() && !to.email.trim()) {
      alert('Enter at least a name or email in "Bill To" before saving as a client.')
      return
    }
    setSavingClient(true)
    try {
      await saveClient({
        name: to.name,
        email: to.email,
        address: to.address,
        phone: to.phone,
        gstin: to.gstin ?? '',
        stateName: to.stateName ?? '',
        stateCode: to.stateCode ?? '',
      })
      setClients(await listClients())
      alert('Saved to your clients — you can reuse it from the picker next time.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save client')
    } finally {
      setSavingClient(false)
    }
  }

  useEffect(() => {
    if (mode !== 'new') return

    nextInvoiceNumber()
      .then(setInvoiceNumber)
      .catch(() => setLoadError('Could not allocate an invoice number. Please reload before saving.'))

    // Surface the plan's monthly invoice allowance up front.
    getInvoiceQuota()
      .then(setQuota)
      .catch(() => setLoadError('Could not verify your invoice allowance. Please reload before saving.'))

    // Pre-fill the seller ("From") side and bank block from the saved profile.
    getMyProfile()
      .then((p) => {
        if (!p) return
        setFrom({
          name: p.companyName || p.fullName,
          email: p.email,
          address: p.address,
          phone: p.phone,
          gstin: p.gstin,
          stateName: p.stateName,
          stateCode: p.stateCode,
        })
        setSellerPan(p.pan)
        setBankAccountName(p.bankAccountName)
        setBankName(p.bankName)
        setAccountNumber(p.accountNumber)
        setIfscCode(p.ifscCode)
        setBankBranch(p.bankBranch)
        setJurisdiction(p.jurisdiction)
      })
      .catch(() => setLoadError('Could not load your saved business profile.'))
  }, [mode])

  function updateLineItem(
    id: string,
    field: keyof LineItem,
    rawValue: string,
  ) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const numericFields: (keyof LineItem)[] = ['quantity', 'rate', 'gstRate']
        const value =
          field === 'gstRate' && rawValue === ''
            ? undefined
            : numericFields.includes(field)
              ? Math.max(0, parseFloat(rawValue) || 0)
              : rawValue
        const updated: LineItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = roundMoney(Number(updated.quantity) * Number(updated.rate))
        }
        return updated
      }),
    )
  }

  function addLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0, hsnCode: '', unit: 'Units' },
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
      gstType,
      sellerPan,
      bankAccountName,
      bankName,
      accountNumber,
      ifscCode,
      bankBranch,
      jurisdiction,
      deliveryNote,
      buyerOrderNo,
      dispatchThrough,
      destination,
    }
    setSaveError(null)
    try {
      if (mode === 'new') await createInvoice(invoice)
      else await updateInvoice(invoice)
      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      const message = databaseErrorMessage(error)
      console.warn('Failed to save invoice:', message)
      if (message.includes('INVOICE_LIMIT_REACHED')) {
        alert("You've reached your plan's monthly invoice limit. Upgrade your plan to create more.")
        router.push('/subscribe')
      } else if (message.includes('Not authenticated')) {
        alert('You must be logged in to save an invoice.')
        router.push('/login')
      } else {
        setSaveError(message)
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

  const limitReached = mode === 'new' && !!quota?.reached

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
            disabled={limitReached}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Invoice
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">Could not save the invoice</div>
          <div className="mt-1 break-words">{saveError}</div>
        </div>
      )}

      {mode === 'new' && quota && quota.limit !== null && (
        <div
          className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            limitReached
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-gray-200 bg-gray-50 text-gray-600'
          }`}
        >
          <span>
            {limitReached ? (
              <>You&apos;ve used all <b>{quota.limit}</b> invoices in your plan this month.</>
            ) : (
              <>
                <b>{quota.used}</b> of <b>{quota.limit}</b> invoices used this month
                {quota.remaining !== null && <> · {quota.remaining} left</>}
              </>
            )}
          </span>
          {limitReached && (
            <button
              onClick={() => router.push('/subscribe')}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              Upgrade plan
            </button>
          )}
        </div>
      )}

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
            enableGstinLookup
          />
          <PartySection
            title="Bill To (Client)"
            party={to}
            onChange={setTo}
            inputCls={inputCls}
            labelCls={labelCls}
            enableGstinLookup
            beforeFields={
              <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                {clients.length > 0 ? (
                  <div>
                    <label className={labelCls}>Use a saved client</label>
                    <select
                      value=""
                      onChange={(e) => applyClient(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a client…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {[c.name || c.email || 'Unnamed client', c.phone, c.gstin]
                            .filter(Boolean)
                            .join(' · ')}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Picking a client fills in every field below automatically.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">
                    No saved clients yet. Fill in the details below, then{' '}
                    <b>Save as client</b> to reuse them — or add clients on the{' '}
                    <a href="/clients" className="font-medium text-indigo-600 hover:underline">
                      Clients
                    </a>{' '}
                    page.
                  </p>
                )}
                <button
                  type="button"
                  onClick={saveToAsClient}
                  disabled={savingClient}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {savingClient ? 'Saving…' : 'Save these details as a client'}
                </button>
              </div>
            }
          />
        </div>

        {/* Line items */}
        <Section title="Line Items">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>
                  <th className="w-24 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    HSN/SAC
                  </th>
                  <th className="w-16 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    GST%
                  </th>
                  <th className="w-16 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Unit
                  </th>
                  <th className="w-20 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>
                  <th className="w-28 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate (₹)
                  </th>
                  <th className="w-28 pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                        type="text"
                        value={item.hsnCode || ''}
                        onChange={e => updateLineItem(item.id, 'hsnCode', e.target.value)}
                        placeholder="6901"
                        className={inputCls}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        value={item.gstRate ?? ''}
                        onChange={e => updateLineItem(item.id, 'gstRate', e.target.value)}
                        min="0"
                        max="100"
                        placeholder="12"
                        className={`${inputCls} text-right`}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={e => updateLineItem(item.id, 'unit', e.target.value)}
                        placeholder="Units"
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
                <div className="mb-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>HSN/SAC</label>
                    <input
                      type="text"
                      value={item.hsnCode || ''}
                      onChange={e => updateLineItem(item.id, 'hsnCode', e.target.value)}
                      placeholder="6901"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>GST %</label>
                    <input
                      type="number"
                      value={item.gstRate ?? ''}
                      onChange={e => updateLineItem(item.id, 'gstRate', e.target.value)}
                      min="0"
                      max="100"
                      placeholder={String(taxRate)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <input
                      type="text"
                      value={item.unit || ''}
                      onChange={e => updateLineItem(item.id, 'unit', e.target.value)}
                      placeholder="Units"
                      className={inputCls}
                    />
                  </div>
                </div>
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
                  Default GST (%)
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

        {/* GST Details */}
        <Section title="GST / Tax Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>GST Type</label>
              <select
                value={gstType}
                onChange={e => setGstType(e.target.value as 'cgst_sgst' | 'igst')}
                className={inputCls}
              >
                <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                <option value="igst">IGST (Inter-state)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Seller PAN</label>
              <input
                type="text"
                value={sellerPan}
                onChange={e => setSellerPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jurisdiction City</label>
              <input
                type="text"
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                placeholder="Surat"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Delivery Note</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Buyer&apos;s Order No.</label>
              <input
                type="text"
                value={buyerOrderNo}
                onChange={e => setBuyerOrderNo(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Dispatched Through</label>
              <input
                type="text"
                value={dispatchThrough}
                onChange={e => setDispatchThrough(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelCls}>A/c Holder Name</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value)}
                placeholder="CHAMUNDA BRICKS"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="BANK OF BARODA"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="44850200000036"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={e => setIfscCode(e.target.value.toUpperCase())}
                placeholder="BARB0MAHSUR"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <input
                type="text"
                value={bankBranch}
                onChange={e => setBankBranch(e.target.value)}
                placeholder="MAHUVA"
                className={inputCls}
              />
            </div>
          </div>
        </Section>

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
            disabled={limitReached}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  beforeFields,
  enableGstinLookup,
}: {
  title: string
  party: Party
  onChange: (p: Party) => void
  inputCls: string
  labelCls: string
  beforeFields?: React.ReactNode
  enableGstinLookup?: boolean
}) {
  const [looking, setLooking] = useState(false)
  const [lookupMsg, setLookupMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function set(field: keyof Party, value: string) {
    // A GSTIN self-encodes the state, so fill State Name + Code as it's typed.
    if (field === 'gstin') {
      const parsed = parseGstin(value)
      onChange({
        ...party,
        gstin: parsed.gstin,
        ...(parsed.stateName ? { stateName: parsed.stateName, stateCode: parsed.stateCode } : {}),
      })
      setLookupMsg(null)
      return
    }
    onChange({ ...party, [field]: value })
  }

  // Pull the registered name & address from the GST API (needs a server key).
  async function fetchDetails() {
    setLooking(true)
    setLookupMsg(null)
    try {
      const d = await lookupGstin(party.gstin || '')
      onChange({
        ...party,
        name: d.tradeName || d.legalName || party.name,
        address: d.address || party.address,
        stateName: d.stateName || party.stateName,
        stateCode: d.stateCode || party.stateCode,
      })
      setLookupMsg({ ok: true, text: `Fetched ${d.legalName || d.tradeName || 'details'}` })
    } catch (err) {
      setLookupMsg({ ok: false, text: err instanceof Error ? err.message : 'Lookup failed' })
    } finally {
      setLooking(false)
    }
  }

  const parsed = parseGstin(party.gstin || '')
  const gstinEntered = (party.gstin || '').length > 0

  return (
    <Section title={title}>
      <div className="space-y-3">
        {beforeFields}
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
        <div>
          <label className={labelCls}>GSTIN / UIN</label>
          <input
            type="text"
            value={party.gstin || ''}
            onChange={e => set('gstin', e.target.value)}
            placeholder="24AVJPP1377R1ZT"
            maxLength={15}
            className={inputCls}
          />
          {enableGstinLookup && gstinEntered && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {parsed.stateName ? (
                <span className="text-emerald-600">
                  {parsed.valid ? '✓ ' : ''}State: {parsed.stateName} ({parsed.stateCode})
                  {parsed.pan ? ` · PAN ${parsed.pan}` : ''}
                </span>
              ) : (
                <span className="text-gray-400">Unrecognised state code</span>
              )}
              {(party.gstin || '').length === 15 && !parsed.valid && (
                <span className="text-red-500">Invalid GSTIN format</span>
              )}
              {parsed.valid && (
                <button
                  type="button"
                  onClick={fetchDetails}
                  disabled={looking}
                  className="font-semibold text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
                >
                  {looking ? 'Fetching…' : 'Fetch name & address'}
                </button>
              )}
              {lookupMsg && (
                <span className={lookupMsg.ok ? 'text-emerald-600' : 'text-amber-600'}>
                  {lookupMsg.text}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>State Name</label>
            <input
              type="text"
              value={party.stateName || ''}
              onChange={e => set('stateName', e.target.value)}
              placeholder="Gujarat"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>State Code</label>
            <input
              type="text"
              value={party.stateCode || ''}
              onChange={e => set('stateCode', e.target.value)}
              placeholder="24"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </Section>
  )
}
