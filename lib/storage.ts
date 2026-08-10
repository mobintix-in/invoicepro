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
  seller_pan: string
  bank_account_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  bank_branch: string
  jurisdiction: string
  gst_type: string
  delivery_note: string
  buyer_order_no: string
  dispatch_through: string
  destination: string
}

function optional(value: string): string | undefined {
  return value || undefined
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
    sellerPan: optional(row.seller_pan),
    bankAccountName: optional(row.bank_account_name),
    bankName: optional(row.bank_name),
    accountNumber: optional(row.account_number),
    ifscCode: optional(row.ifsc_code),
    bankBranch: optional(row.bank_branch),
    jurisdiction: optional(row.jurisdiction),
    gstType: row.gst_type === 'igst' ? 'igst' : 'cgst_sgst',
    deliveryNote: optional(row.delivery_note),
    buyerOrderNo: optional(row.buyer_order_no),
    dispatchThrough: optional(row.dispatch_through),
    destination: optional(row.destination),
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await createClient()
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DbRow[]).map(fromDb)
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const { data, error } = await createClient()
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? fromDb(data as DbRow) : undefined
}

function invoiceValues(invoice: Invoice) {
  return {
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
    template: invoice.template ?? 'classic',
    seller_pan: invoice.sellerPan ?? '',
    bank_account_name: invoice.bankAccountName ?? '',
    bank_name: invoice.bankName ?? '',
    account_number: invoice.accountNumber ?? '',
    ifsc_code: invoice.ifscCode ?? '',
    bank_branch: invoice.bankBranch ?? '',
    jurisdiction: invoice.jurisdiction ?? '',
    gst_type: invoice.gstType ?? 'cgst_sgst',
    delivery_note: invoice.deliveryNote ?? '',
    buyer_order_no: invoice.buyerOrderNo ?? '',
    dispatch_through: invoice.dispatchThrough ?? '',
    destination: invoice.destination ?? '',
  }
}

export async function createInvoice(invoice: Invoice): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient().from('invoices').insert({
    id: invoice.id,
    user_id: userId,
    ...invoiceValues(invoice),
  })
  if (error) {
    if (/INVOICE_LIMIT_REACHED/i.test(error.message)) {
      throw new Error('INVOICE_LIMIT_REACHED')
    }
    if (/ACTIVE_PLAN_REQUIRED/i.test(error.message)) {
      throw new Error('ACTIVE_PLAN_REQUIRED')
    }
    throw error
  }
}

export async function updateInvoice(invoice: Invoice): Promise<void> {
  const userId = await getUserId()
  const { error } = await createClient()
    .from('invoices')
    .update(invoiceValues(invoice))
    .eq('id', invoice.id)
    .eq('user_id', userId)
  if (error) throw error
}

export interface InvoiceQuota {
  limit: number | null
  used: number
  remaining: number | null
  reached: boolean
}

export async function getInvoiceQuota(): Promise<InvoiceQuota> {
  const { data, error } = await createClient()
    .rpc('my_invoice_quota')
    .single<{ invoice_limit: number | null; used: number }>()
  if (error) throw error
  if (!data) throw new Error('Invoice quota is unavailable')
  const limit = data.invoice_limit === null ? null : Number(data.invoice_limit)
  const used = Number(data.used) || 0
  const remaining = limit === null ? null : Math.max(0, limit - used)
  return { limit, used, remaining, reached: limit !== null && used >= limit }
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await createClient().from('invoices').delete().eq('id', id)
  if (error) throw error
}

export async function nextInvoiceNumber(): Promise<string> {
  const { data, error } = await createClient().rpc('next_invoice_number')
  if (error) throw error
  if (typeof data !== 'string' || !data) {
    throw new Error('Could not allocate an invoice number')
  }
  return data
}
