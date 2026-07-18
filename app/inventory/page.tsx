'use client'

import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  listInventory,
  saveInventoryItem,
  deleteInventoryItem,
  adjustStock,
  isLowStock,
  type InventoryItem,
  type InventoryItemInput,
} from '@/lib/inventory'

const inputCls =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
const labelCls = 'block text-sm font-medium text-gray-700'

const EMPTY: InventoryItemInput = {
  name: '',
  sku: '',
  description: '',
  hsnCode: '',
  unit: '',
  quantity: 0,
  reorderLevel: 0,
  unitPrice: 0,
  gstRate: 0,
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [items, setItems] = useState<InventoryItem[]>([])
  const [editing, setEditing] = useState<InventoryItemInput | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    setItems(await listInventory())
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    listInventory().then((rows) => {
      setItems(rows)
      setLoading(false)
    })
  }, [])

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.name || item.sku || 'Unnamed item'}"?`)) return
    setBusyId(item.id)
    try {
      await deleteInventoryItem(item.id)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete item')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAdjust(item: InventoryItem, delta: number) {
    setBusyId(item.id)
    try {
      const next = await adjustStock(item.id, delta)
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: next } : it)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update stock')
    } finally {
      setBusyId(null)
    }
  }

  const lowStockCount = items.filter(isLowStock).length
  const stockValue = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)

  if (loading) {
    return (
      <main className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} item{items.length === 1 ? '' : 's'} in your catalog
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Item
        </button>
      </div>

      {items.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total items</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Low stock</p>
            <p className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stock value</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(stockValue)}</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No items yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add products or services to track stock and reuse on invoices.</p>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Item / SKU</th>
                <th className="px-4 py-3">HSN / Unit</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => {
                const low = isLowStock(it)
                return (
                  <tr key={it.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{it.name || '—'}</div>
                      {it.sku && <div className="font-mono text-xs text-gray-500">{it.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="font-mono text-xs text-gray-800">{it.hsnCode || '—'}</div>
                      <div className="text-xs text-gray-500">{it.unit || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleAdjust(it, -1)}
                          disabled={busyId === it.id || it.quantity <= 0}
                          aria-label="Decrease stock"
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span
                          className={`inline-flex min-w-[3rem] items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
                            low ? 'bg-amber-50 text-amber-700' : 'text-gray-900'
                          }`}
                          title={low ? `At or below reorder level (${it.reorderLevel})` : undefined}
                        >
                          {it.quantity}
                          {low && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                          )}
                        </span>
                        <button
                          onClick={() => handleAdjust(it, 1)}
                          disabled={busyId === it.id}
                          aria-label="Increase stock"
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(it.unitPrice)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{it.gstRate ? `${it.gstRate}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setEditing({
                              id: it.id,
                              name: it.name,
                              sku: it.sku,
                              description: it.description,
                              hsnCode: it.hsnCode,
                              unit: it.unit,
                              quantity: it.quantity,
                              reorderLevel: it.reorderLevel,
                              unitPrice: it.unitPrice,
                              gstRate: it.gstRate,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(it)}
                          disabled={busyId === it.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ItemModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await refresh()
          }}
        />
      )}
    </main>
  )
}

function ItemModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: InventoryItemInput
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<InventoryItemInput>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof InventoryItemInput>(key: K, value: InventoryItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setNumber<K extends keyof InventoryItemInput>(key: K, value: string) {
    const n = parseFloat(value)
    set(key, (Number.isFinite(n) ? n : 0) as InventoryItemInput[K])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() && !form.sku.trim()) {
      setError('Please enter at least a name or an SKU.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveInventoryItem(form)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {initial.id ? 'Edit item' : 'Add item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="i-name" className={labelCls}>Item name</label>
              <input id="i-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Cotton T-Shirt" className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-sku" className={labelCls}>SKU</label>
              <input id="i-sku" type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="TSHIRT-001" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="i-desc" className={labelCls}>Description</label>
            <textarea id="i-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short product description" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="i-hsn" className={labelCls}>HSN / SAC code</label>
              <input id="i-hsn" type="text" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} placeholder="6109" className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-unit" className={labelCls}>Unit</label>
              <input id="i-unit" type="text" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="PCS" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="i-qty" className={labelCls}>Stock</label>
              <input id="i-qty" type="number" min={0} step="any" value={form.quantity} onChange={(e) => setNumber('quantity', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-reorder" className={labelCls}>Reorder at</label>
              <input id="i-reorder" type="number" min={0} step="any" value={form.reorderLevel} onChange={(e) => setNumber('reorderLevel', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-price" className={labelCls}>Unit price</label>
              <input id="i-price" type="number" min={0} step="any" value={form.unitPrice} onChange={(e) => setNumber('unitPrice', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-gst" className={labelCls}>GST %</label>
              <input id="i-gst" type="number" min={0} step="any" value={form.gstRate} onChange={(e) => setNumber('gstRate', e.target.value)} className={inputCls} />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
