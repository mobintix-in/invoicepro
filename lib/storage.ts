import { createClient } from '@/lib/supabase/client'
import type { Invoice } from '@/types'

type DbRow = {
  id: string
  user_id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  from_party: unknown
  to_party: unknown
  line_items: unknown
  notes: string
  tax_rate: number
  subtotal: number
  tax: number
  total: number
  created_at: string
  updated_at: string
  template: string
}

function fromDb(row: DbRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status as Invoice['status'],
    issueDate: row.issue_date,
    dueDate: row.due_date,
    from: row.from_party as Invoice['from'],
    to: row.to_party as Invoice['to'],
    lineItems: row.line_items as Invoice['lineItems'],
    notes: row.notes,
    taxRate: Number(row.tax_rate),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    template: row.template ?? 'classic',
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser()
  if (error) {
    console.warn('Supabase auth error:', error.message)
    throw new Error('Not authenticated')
  }
  if (!data.user) {
    console.warn('No user found in session')
    throw new Error('Not authenticated')
  }
  return data.user.id
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await createClient()
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('Failed to fetch invoices:', error.message || error)
    return []
  }
  return (data as DbRow[]).map(fromDb)
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const { data, error } = await createClient()
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return fromDb(data as DbRow)
}

function toRow(invoice: Invoice, userId: string) {
  return {
    id: invoice.id,
    user_id: userId,
    invoice_number: invoice.invoiceNumber,
    status: invoice.status,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    from_party: invoice.from,
    to_party: invoice.to,
    line_items: invoice.lineItems,
    notes: invoice.notes,
    tax_rate: invoice.taxRate,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
    template: invoice.template ?? 'classic',
  }
}

/**
 * Insert a brand-new invoice. This is the only path subject to the monthly plan
 * quota — the DB's BEFORE INSERT trigger raises INVOICE_LIMIT_REACHED when the
 * plan's cap is hit, which we normalise for the UI to detect.
 */
export async function createInvoice(invoice: Invoice): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient().from('invoices').insert(toRow(invoice, userId))
  if (error) {
    if (/INVOICE_LIMIT_REACHED/i.test(error.message)) throw new Error('INVOICE_LIMIT_REACHED')
    throw error
  }
}

/** Update an existing invoice (edits and status changes). Not quota-limited. */
export async function updateInvoice(invoice: Invoice): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient()
    .from('invoices')
    .update(toRow(invoice, userId))
    .eq('id', invoice.id)
  if (error) throw error
}

export interface InvoiceQuota {
  limit: number | null // null = unlimited
  used: number
  remaining: number | null
  reached: boolean
}

/**
 * The current user's monthly invoice allowance and usage, via the
 * my_invoice_quota() RPC. Degrades to unlimited if the RPC/migration is absent.
 */
export async function getInvoiceQuota(): Promise<InvoiceQuota> {
  const { data, error } = await createClient()
    .rpc('my_invoice_quota')
    .single<{ invoice_limit: number | null; used: number }>()
  if (error || !data) return { limit: null, used: 0, remaining: null, reached: false }
  const limit = data.invoice_limit === null ? null : Number(data.invoice_limit)
  const used = Number(data.used) || 0
  const remaining = limit === null ? null : Math.max(0, limit - used)
  return { limit, used, remaining, reached: limit !== null && used >= limit }
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await createClient()
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function nextInvoiceNumber(): Promise<string> {
  const invoices = await getInvoices()
  const nums = invoices
    .map(inv => parseInt(inv.invoiceNumber.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n) && n > 0)
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `INV-${String(max + 1).padStart(4, '0')}`
}
