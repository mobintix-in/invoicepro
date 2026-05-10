export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Party {
  name: string
  email: string
  address: string
  phone: string
  gstin?: string
  stateName?: string
  stateCode?: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  hsnCode?: string
  unit?: string
  gstRate?: number
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
  // GST / Tax Invoice fields
  sellerPan?: string
  bankAccountName?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  bankBranch?: string
  jurisdiction?: string
  gstType?: 'cgst_sgst' | 'igst'
  deliveryNote?: string
  buyerOrderNo?: string
  dispatchThrough?: string
  destination?: string
}
