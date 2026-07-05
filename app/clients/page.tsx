'use client'

import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { listClients, saveClient, deleteClient, type Client, type ClientInput } from '@/lib/clients'

const inputCls =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
const labelCls = 'block text-sm font-medium text-gray-700'

const EMPTY: ClientInput = {
  name: '',
  email: '',
  address: '',
  phone: '',
  gstin: '',
  stateName: '',
  stateCode: '',
}

export default function ClientsPage() {
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [clients, setClients] = useState<Client[]>([])
  const [editing, setEditing] = useState<ClientInput | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    setClients(await listClients())
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    listClients().then((cs) => {
      setClients(cs)
      setLoading(false)
    })
  }, [])

  async function handleDelete(client: Client) {
    if (!confirm(`Delete client "${client.name || client.email || 'Unnamed'}"?`)) return
    setBusyId(client.id)
    try {
      await deleteClient(client.id)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete client')
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length} client{clients.length === 1 ? '' : 's'} registered
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No clients yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add a client to reuse them on invoices.</p>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Name / Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{c.email || '—'}</div>
                    <div className="text-xs text-gray-500">{c.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{c.gstin || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.stateName || '—'}
                    {c.stateCode ? ` (${c.stateCode})` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            email: c.email,
                            address: c.address,
                            phone: c.phone,
                            gstin: c.gstin,
                            stateName: c.stateName,
                            stateCode: c.stateCode,
                          })
                        }
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={busyId === c.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
      )}

      {editing && (
        <ClientModal
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

function ClientModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ClientInput
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<ClientInput>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() && !form.email.trim()) {
      setError('Please enter at least a name or an email.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveClient(form)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {initial.id ? 'Edit client' : 'Add client'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="c-name" className={labelCls}>Name / Company</label>
            <input id="c-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corp" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-email" className={labelCls}>Email</label>
              <input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hello@example.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-phone" className={labelCls}>Phone</label>
              <input id="c-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="c-address" className={labelCls}>Address</label>
            <textarea id="c-address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, City, State" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="c-gstin" className={labelCls}>GSTIN / UIN</label>
              <input id="c-gstin" type="text" value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="24AVJPP1377R1ZT" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-state" className={labelCls}>State Name</label>
              <input id="c-state" type="text" value={form.stateName} onChange={(e) => set('stateName', e.target.value)} placeholder="Gujarat" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-code" className={labelCls}>State Code</label>
              <input id="c-code" type="text" value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)} placeholder="24" className={inputCls} />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
