export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Party {
  name: string
  email: string
  address: string
  phone: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  from: Party
  to: Party
  lineItems: LineItem[]
  notes: string
  taxRate: number
  subtotal: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
}
