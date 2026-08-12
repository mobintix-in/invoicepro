'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import FabricLotPDFButton from '@/components/FabricLotPDFButton'
import { formatCurrency, generateId, roundMoney } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  createEmptyFabricLot,
  deleteFabricLot,
  downloadFabricChallan,
  listFabricLots,
  saveFabricLot,
  totalFabricMeters,
  type FabricGrade,
  type FabricLot,
  type FabricLotInput,
  type FabricRoll,
  type FabricStatus,
} from '@/lib/fabric-production'

const inputCls =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
const labelCls = 'block text-sm font-medium text-gray-700'

const STATUS: Record<FabricStatus, { label: string; className: string }> = {
  inward: { label: 'Inward', className: 'bg-sky-50 text-sky-700' },
  in_production: { label: 'In production', className: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  dispatched: { label: 'Dispatched', className: 'bg-violet-50 text-violet-700' },
}

function formatMeters(value: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function fabricLotAmount(lot: FabricLot) {
  const subtotal = totalFabricMeters(lot) * lot.ratePerMeter
  return roundMoney(subtotal + subtotal * (lot.gstRate / 100))
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const value = error as { code?: string; message?: string; hint?: string }
    if (value.code === '42P01' || value.code === 'PGRST202') {
      return 'Fabric Production database setup is pending. Deploy the latest Supabase migration.'
    }
    return [value.message, value.hint].filter(Boolean).join(' · ') || 'Something went wrong'
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}

function toInput(lot: FabricLot): FabricLotInput {
  return {
    id: lot.id,
    productionCompany: lot.productionCompany,
    partyName: lot.partyName,
    challanNumber: lot.challanNumber,
    challanDate: lot.challanDate,
    lotNumber: lot.lotNumber,
    category: lot.category,
    quality: lot.quality,
    shade: lot.shade,
    variation: lot.variation,
    construction: lot.construction,
    widthInches: lot.widthInches,
    gsm: lot.gsm,
    hsnCode: lot.hsnCode,
    ratePerMeter: lot.ratePerMeter,
    gstRate: lot.gstRate,
    status: lot.status,
    challanFilePath: lot.challanFilePath,
    notes: lot.notes,
    rolls: lot.rolls.map((roll) => ({ ...roll })),
  }
}

export default function FabricProductionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [lots, setLots] = useState<FabricLot[]>([])
  const [editing, setEditing] = useState<FabricLotInput | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FabricStatus>('all')
  const [pageError, setPageError] = useState<string | null>(null)

  async function refresh() {
    setLots(await listFabricLots())
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    listFabricLots()
      .then(setLots)
      .catch((error) => setPageError(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const rolls = lots.reduce((sum, lot) => sum + lot.rolls.length, 0)
    const meters = lots.reduce((sum, lot) => sum + totalFabricMeters(lot), 0)
    const totalValue = lots.reduce((sum, lot) => sum + fabricLotAmount(lot), 0)
    const inProduction = lots.filter((lot) => lot.status === 'in_production').length
    return { rolls, meters, totalValue, inProduction }
  }, [lots])

  const filteredLots = useMemo(() => {
    const term = query.trim().toLowerCase()
    return lots.filter((lot) => {
      if (statusFilter !== 'all' && lot.status !== statusFilter) return false
      if (!term) return true
      return [
        lot.productionCompany,
        lot.partyName,
        lot.challanNumber,
        lot.lotNumber,
        lot.category,
        lot.quality,
        lot.shade,
        lot.variation,
        lot.construction,
      ].some((value) => value.toLowerCase().includes(term))
    })
  }, [lots, query, statusFilter])

  async function handleDelete(lot: FabricLot) {
    if (!confirm('Delete lot "' + (lot.lotNumber || lot.challanNumber || lot.id) + '" and all its rolls?')) return
    setBusyId(lot.id)
    try {
      await deleteFabricLot(lot)
      setLots((current) => current.filter((item) => item.id !== lot.id))
    } catch (error) {
      alert(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  async function handleChallanDownload(lot: FabricLot) {
    if (!lot.challanFilePath) return
    setBusyId(lot.id)
    try {
      const blob = await downloadFabricChallan(lot.challanFilePath)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = lot.challanFilePath.split('/').pop() || 'challan'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fabric Production</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track inward challans, lots, quality, shade variation, and every roll in metres.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(createEmptyFabricLot())}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Fabric Lot
        </button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-5">
        <SummaryCard label="Total lots" value={String(lots.length)} />
        <SummaryCard label="Total rolls / thans" value={String(summary.rolls)} />
        <SummaryCard label="Total metres" value={formatMeters(summary.meters) + ' m'} />
        <SummaryCard label="Total amount" value={formatCurrency(summary.totalValue)} />
        <SummaryCard label="In production" value={String(summary.inProduction)} accent />
      </section>

      <section className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="fabric-search" className="sr-only">Search fabric lots</label>
          <input
            id="fabric-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, lot, challan, category, shade..."
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | FabricStatus)}
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS).map(([value, item]) => (
            <option key={value} value={value}>{item.label}</option>
          ))}
        </select>
      </section>

      {pageError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {filteredLots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.75h15v16.5h-15V3.75zm3 0v3m3-3v2m3-2v3m3-3v2M4.5 9h4.125M4.5 12h2.625M4.5 15h4.125M4.5 18h2.625" />
            </svg>
          </div>
          <h2 className="mt-4 text-sm font-semibold text-gray-900">
            {lots.length === 0 ? 'No fabric lots yet' : 'No matching fabric lots'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {lots.length === 0
              ? 'Record the first inward challan and its roll-wise metre lengths.'
              : 'Try a different search or status filter.'}
          </p>
          {lots.length === 0 && (
            <button
              type="button"
              onClick={() => setEditing(createEmptyFabricLot())}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add first fabric lot
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:hidden">
            {filteredLots.map((lot) => (
              <FabricLotCard
                key={lot.id}
                lot={lot}
                busy={busyId === lot.id}
                onInvoice={() => router.push('/invoices/new?fabricLot=' + encodeURIComponent(lot.id))}
                onChallan={() => handleChallanDownload(lot)}
                onEdit={() => setEditing(toInput(lot))}
                onDelete={() => handleDelete(lot)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white xl:block">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Lot / Challan</th>
                <th className="px-4 py-3">Production / Party</th>
                <th className="px-4 py-3">Fabric details</th>
                <th className="px-4 py-3 text-center">Rolls</th>
                <th className="px-4 py-3 text-right">Metres</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLots.map((lot) => (
                <tr key={lot.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{lot.lotNumber || 'No lot number'}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Challan {lot.challanNumber || '?'}
                      {lot.challanDate ? ' · ' + new Date(lot.challanDate + 'T00:00:00').toLocaleDateString('en-IN') : ''}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">{lot.productionCompany || '?'}</div>
                    <div className="mt-1 text-xs text-gray-500">{lot.partyName || 'No party'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">
                      {[lot.category, lot.quality].filter(Boolean).join(' · ') || '?'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {[lot.shade, lot.variation, lot.construction].filter(Boolean).join(' · ') || 'No variation details'}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {lot.widthInches ? lot.widthInches + '" width' : ''}
                      {lot.widthInches && lot.gsm ? ' · ' : ''}
                      {lot.gsm ? lot.gsm + ' GSM' : ''}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {[lot.hsnCode ? 'HSN ' + lot.hsnCode : '', formatCurrency(lot.ratePerMeter) + '/m', lot.gstRate + '% GST']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex min-w-10 justify-center rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                      {lot.rolls.length}
                    </span>
                    <div className="mt-2 text-xs text-gray-400">
                      {lot.rolls.slice(0, 3).map((roll) => roll.rollNumber || '?').join(', ')}
                      {lot.rolls.length > 3 ? ' +' + (lot.rolls.length - 3) : ''}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-base font-bold text-gray-900">
                    {formatMeters(totalFabricMeters(lot))} m
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(fabricLotAmount(lot))}</div>
                    <div className="mt-1 text-xs text-gray-400">including {lot.gstRate}% GST</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' + STATUS[lot.status].className}>
                      {STATUS[lot.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push('/invoices/new?fabricLot=' + encodeURIComponent(lot.id))}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Invoice
                      </button>
                      <FabricLotPDFButton lot={lot} />
                      {lot.challanFilePath && (
                        <button
                          type="button"
                          onClick={() => handleChallanDownload(lot)}
                          disabled={busyId === lot.id}
                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                        >
                          Challan
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(toInput(lot))}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lot)}
                        disabled={busyId === lot.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {editing && (
        <FabricLotModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh()
            setEditing(null)
          }}
        />
      )}
    </main>
  )
}

function FabricLotCard({
  lot,
  busy,
  onInvoice,
  onChallan,
  onEdit,
  onDelete,
}: {
  lot: FabricLot
  busy: boolean
  onInvoice: () => void
  onChallan: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-gray-900">{lot.lotNumber || 'No lot number'}</h2>
          <p className="mt-1 text-xs text-gray-500">
            Challan {lot.challanNumber || '-'}
            {lot.challanDate ? ' · ' + new Date(lot.challanDate + 'T00:00:00').toLocaleDateString('en-IN') : ''}
          </p>
        </div>
        <span className={'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' + STATUS[lot.status].className}>
          {STATUS[lot.status].label}
        </span>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Production / party</p>
          <p className="mt-1 font-medium text-gray-900">{lot.productionCompany || '-'}</p>
          <p className="mt-0.5 text-sm text-gray-500">{lot.partyName || 'No party'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fabric details</p>
          <p className="mt-1 font-medium text-gray-900">
            {[lot.category, lot.quality].filter(Boolean).join(' · ') || '-'}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {[lot.shade, lot.variation, lot.construction].filter(Boolean).join(' · ') || 'No variation details'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {[
              lot.widthInches ? lot.widthInches + '" width' : '',
              lot.gsm ? lot.gsm + ' GSM' : '',
              lot.hsnCode ? 'HSN ' + lot.hsnCode : '',
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 border-y border-gray-100 bg-gray-50/70">
        <div className="px-3 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Rolls</p>
          <p className="mt-1 font-bold text-gray-900">{lot.rolls.length}</p>
        </div>
        <div className="border-x border-gray-200 px-3 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Metres</p>
          <p className="mt-1 font-bold text-gray-900">{formatMeters(totalFabricMeters(lot))} m</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Amount</p>
          <p className="mt-1 font-bold text-gray-900">{formatCurrency(fabricLotAmount(lot))}</p>
          <p className="text-[10px] text-gray-400">incl. {lot.gstRate}% GST</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button type="button" onClick={onInvoice} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
          Invoice
        </button>
        <FabricLotPDFButton lot={lot} />
        {lot.challanFilePath && (
          <button type="button" onClick={onChallan} disabled={busy} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
            Challan
          </button>
        )}
        <button type="button" onClick={onEdit} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          Edit
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          Delete
        </button>
      </div>
    </article>
  )
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={'mt-1 break-words text-xl font-bold sm:text-2xl ' + (accent ? 'text-amber-600' : 'text-gray-900')}>{value}</p>
    </div>
  )
}

function FabricLotModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: FabricLotInput
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState<FabricLotInput>(initial)
  const [challanFile, setChallanFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalMeters = form.rolls.reduce((sum, roll) => sum + (Number(roll.meters) || 0), 0)
  const subtotalAmount = roundMoney(totalMeters * form.ratePerMeter)
  const totalAmount = roundMoney(subtotalAmount + subtotalAmount * (form.gstRate / 100))

  function update<K extends keyof FabricLotInput>(key: K, value: FabricLotInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateNumber(key: 'widthInches' | 'gsm', value: string) {
    update(key, value === '' ? null : Number(value))
  }

  function updateCommercialNumber(key: 'ratePerMeter' | 'gstRate', value: string) {
    const number = Math.max(0, Number(value) || 0)
    update(key, key === 'gstRate' ? Math.min(100, number) : number)
  }

  function updateRoll<K extends keyof FabricRoll>(
    id: string,
    key: K,
    value: FabricRoll[K],
  ) {
    setForm((current) => ({
      ...current,
      rolls: current.rolls.map((roll) =>
        roll.id === id ? { ...roll, [key]: value } : roll,
      ),
    }))
  }

  function addRoll() {
    setForm((current) => ({
      ...current,
      rolls: [
        ...current.rolls,
        {
          id: generateId(),
          rollNumber: String(current.rolls.length + 1),
          meters: 0,
          grade: 'A',
          shadeVariation: '',
        },
      ],
    }))
  }

  function removeRoll(id: string) {
    setForm((current) => ({
      ...current,
      rolls: current.rolls.length > 1
        ? current.rolls.filter((roll) => roll.id !== id)
        : current.rolls,
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.productionCompany.trim()) {
      setError('Production company is required.')
      return
    }
    if (!form.lotNumber.trim()) {
      setError('Lot / batch number is required.')
      return
    }
    if (!form.category.trim() && !form.quality.trim()) {
      setError('Enter a fabric category or quality.')
      return
    }
    if (!form.rolls.some((roll) => roll.meters > 0)) {
      setError('Enter the metre length for at least one roll / thaan.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await saveFabricLot(form, challanFile)
      await onSaved()
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fabric-lot-dialog-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="fabric-lot-dialog-title" className="text-lg font-semibold text-gray-900">
              {initial.productionCompany ? 'Edit fabric lot' : 'Add fabric lot'}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Inward, production, and roll-wise metre details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <FormSection title="Inward & production details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Production company" id="f-company" className="lg:col-span-2">
                <input id="f-company" value={form.productionCompany} onChange={(event) => update('productionCompany', event.target.value)} placeholder="Shree Textile Mills" className={inputCls} />
              </Field>
              <Field label="Party / supplier" id="f-party" className="lg:col-span-2">
                <input id="f-party" value={form.partyName} onChange={(event) => update('partyName', event.target.value)} placeholder="Party or supplier name" className={inputCls} />
              </Field>
              <Field label="Challan number" id="f-challan">
                <input id="f-challan" value={form.challanNumber} onChange={(event) => update('challanNumber', event.target.value)} placeholder="CH-1007" className={inputCls} />
              </Field>
              <Field label="Challan date" id="f-date">
                <input id="f-date" type="date" value={form.challanDate} onChange={(event) => update('challanDate', event.target.value)} className={inputCls} />
              </Field>
              <Field label="Lot / batch number" id="f-lot">
                <input id="f-lot" value={form.lotNumber} onChange={(event) => update('lotNumber', event.target.value)} placeholder="LOT-2026-041" className={inputCls} />
              </Field>
              <Field label="Status" id="f-status">
                <select id="f-status" value={form.status} onChange={(event) => update('status', event.target.value as FabricStatus)} className={inputCls}>
                  {Object.entries(STATUS).map(([value, item]) => (
                    <option key={value} value={value}>{item.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Fabric category & variation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Category" id="f-category">
                <input id="f-category" value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Cotton, polyester, grey..." className={inputCls} />
              </Field>
              <Field label="Quality / design" id="f-quality">
                <input id="f-quality" value={form.quality} onChange={(event) => update('quality', event.target.value)} placeholder="Poplin, twill, satin..." className={inputCls} />
              </Field>
              <Field label="Colour / shade" id="f-shade">
                <input id="f-shade" value={form.shade} onChange={(event) => update('shade', event.target.value)} placeholder="Navy blue" className={inputCls} />
              </Field>
              <Field label="Variation" id="f-variation">
                <input id="f-variation" value={form.variation} onChange={(event) => update('variation', event.target.value)} placeholder="Shade V1 / colour code" className={inputCls} />
              </Field>
              <Field label="Construction / count" id="f-construction" className="sm:col-span-2">
                <input id="f-construction" value={form.construction} onChange={(event) => update('construction', event.target.value)} placeholder="Example: 100 x 100 / 40s x 40s" className={inputCls} />
              </Field>
              <Field label="Width (inches)" id="f-width">
                <input id="f-width" type="number" min={0} step="0.01" value={form.widthInches ?? ''} onChange={(event) => updateNumber('widthInches', event.target.value)} placeholder="58" className={inputCls} />
              </Field>
              <Field label="GSM" id="f-gsm">
                <input id="f-gsm" type="number" min={0} step="0.01" value={form.gsm ?? ''} onChange={(event) => updateNumber('gsm', event.target.value)} placeholder="180" className={inputCls} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Invoice pricing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="HSN / SAC" id="f-hsn">
                <input id="f-hsn" value={form.hsnCode} onChange={(event) => update('hsnCode', event.target.value)} placeholder="5208" className={inputCls} />
              </Field>
              <Field label="Rate per metre (₹)" id="f-rate">
                <input id="f-rate" type="number" min={0} step="0.01" value={form.ratePerMeter || ''} onChange={(event) => updateCommercialNumber('ratePerMeter', event.target.value)} placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="GST %" id="f-gst">
                <input id="f-gst" type="number" min={0} max={100} step="0.01" value={form.gstRate || ''} onChange={(event) => updateCommercialNumber('gstRate', event.target.value)} placeholder="5" className={inputCls} />
              </Field>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total amount</p>
                <p className="mt-1 text-xl font-bold text-indigo-950">{formatCurrency(totalAmount)}</p>
                <p className="mt-0.5 text-xs text-indigo-700">
                  {formatCurrency(subtotalAmount)} + {form.gstRate}% GST
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Roll / thaan-wise metre length"
            action={
              <button type="button" onClick={addRoll} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                + Add roll
              </button>
            }
          >
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5">Roll / thaan no.</th>
                    <th className="px-3 py-2.5">Length (metres)</th>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-3 py-2.5">Shade variation / remarks</th>
                    <th className="w-12 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.rolls.map((roll, index) => (
                    <tr key={roll.id}>
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={'Roll number ' + (index + 1)}
                          value={roll.rollNumber}
                          onChange={(event) => updateRoll(roll.id, 'rollNumber', event.target.value)}
                          placeholder={String(index + 1)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <input
                            aria-label={'Metres for roll ' + (index + 1)}
                            type="number"
                            min={0}
                            step="0.01"
                            value={roll.meters || ''}
                            onChange={(event) => updateRoll(roll.id, 'meters', Number(event.target.value))}
                            placeholder="0.00"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-9 outline-none focus:border-indigo-500"
                          />
                          <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-gray-400">m</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          aria-label={'Grade for roll ' + (index + 1)}
                          value={roll.grade}
                          onChange={(event) => updateRoll(roll.id, 'grade', event.target.value as FabricGrade)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        >
                          <option value="A">A grade</option>
                          <option value="B">B grade</option>
                          <option value="C">C grade</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={'Shade remarks for roll ' + (index + 1)}
                          value={roll.shadeVariation}
                          onChange={(event) => updateRoll(roll.id, 'shadeVariation', event.target.value)}
                          placeholder="Same shade / lighter / darker..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeRoll(roll.id)}
                          disabled={form.rolls.length === 1}
                          aria-label={'Remove roll ' + (index + 1)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-indigo-50">
                    <td className="px-3 py-3 font-semibold text-indigo-900">{form.rolls.length} rolls / thans</td>
                    <td className="px-3 py-3 text-base font-bold text-indigo-900">{formatMeters(totalMeters)} m total</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </FormSection>

          <FormSection title="Challan document & notes">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="f-file" className={labelCls}>Upload challan</label>
                <input
                  id="f-file"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => setChallanFile(event.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3.5 py-3 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:font-semibold file:text-indigo-700"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  PDF or image, maximum 10 MB.
                  {form.challanFilePath ? ' A saved challan is already attached.' : ''}
                </p>
              </div>
              <Field label="Production notes" id="f-notes">
                <textarea
                  id="f-notes"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  placeholder="Processing instructions, machine, expected output, defects..."
                  className={inputCls + ' resize-none'}
                />
              </Field>
            </div>
          </FormSection>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm text-gray-500">
              {form.rolls.length} rolls · <strong className="text-gray-900">{formatMeters(totalMeters)} metres</strong>
              {' · '}<strong className="text-indigo-700">{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save fabric lot'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  id,
  className = '',
  children,
}: {
  label: string
  id: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
    </div>
  )
}
