export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type InvoiceType =
  | 'tax_invoice'
  | 'quotation'
  | 'proforma'
  | 'bill_of_supply'
  | 'composition'
  | 'credit_note'
  | 'delivery_challan'

export interface InvoiceTypeDefinition {
  id: InvoiceType
  label: string
  shortLabel: string
  title: string
  subtitle?: string
  numberLabel: string
  description: string
  badgeClass: string
}

export const INVOICE_TYPES: InvoiceTypeDefinition[] = [
  {
    id: 'tax_invoice',
    label: 'Tax Invoice',
    shortLabel: 'Tax Invoice',
    title: 'TAX INVOICE',
    numberLabel: 'Invoice Number',
    description: 'Standard GST tax invoice for supply of taxable goods or services.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  {
    id: 'quotation',
    label: 'Quotation',
    shortLabel: 'Quotation',
    title: 'QUOTATION',
    numberLabel: 'Quotation Number',
    description: 'Formal quotation / price estimate provided to customers before purchase.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
  {
    id: 'proforma',
    label: 'Proforma / Estimate',
    shortLabel: 'Proforma',
    title: 'PROFORMA INVOICE',
    subtitle: 'Proforma Invoice / Estimate',
    numberLabel: 'Proforma Number',
    description: 'Preliminary bill of sale sent before items are supplied or shipped.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  {
    id: 'bill_of_supply',
    label: 'Bill of Supply (No GST)',
    shortLabel: 'Bill of Supply',
    title: 'BILL OF SUPPLY',
    subtitle: '(Issued under GST Law - No Tax Charged)',
    numberLabel: 'Bill Number',
    description: 'For supply of exempt goods/services or by unregistered/non-GST sellers.',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
  },
  {
    id: 'composition',
    label: 'Composition (Bill of Supply)',
    shortLabel: 'Composition',
    title: 'BILL OF SUPPLY',
    subtitle: 'Composition taxable person, not eligible to collect tax on supplies',
    numberLabel: 'Bill Number',
    description: 'For businesses registered under the GST Composition Scheme (Section 10).',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  {
    id: 'credit_note',
    label: 'Credit Note',
    shortLabel: 'Credit Note',
    title: 'CREDIT NOTE',
    numberLabel: 'Credit Note Number',
    description: 'Issued to adjust an invoice for returns, discounts, or rate reductions.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  {
    id: 'delivery_challan',
    label: 'Delivery Challan',
    shortLabel: 'Delivery Challan',
    title: 'DELIVERY CHALLAN',
    subtitle: '(Issued under Rule 55 of CGST Rules - Transportation of Goods without Supply)',
    numberLabel: 'Challan Number',
    description: 'For moving goods for job work, demo, approval, or transfer between premises.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  },
]

export function getInvoiceTypeDefinition(type?: string): InvoiceTypeDefinition {
  if (!type) return INVOICE_TYPES[0]
  const found = INVOICE_TYPES.find(
    (t) => t.id === type || t.label.toLowerCase() === type.toLowerCase(),
  )
  return found || INVOICE_TYPES[0]
}

export interface Party {
  name: string
  email: string
  address: string
  phone: string
  gstin?: string
  stateName?: string
  stateCode?: string
  logoUrl?: string
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
  invoiceType?: InvoiceType
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
  template?: string
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
  upiId?: string
  invoiceTheme?: string
}
