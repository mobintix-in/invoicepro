'use client'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDFDocument } from './InvoicePDF'
import type { Invoice } from '@/types'

export default function InvoicePDFButton({ invoice }: { invoice: Invoice }) {
  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} />}
      fileName={`${invoice.invoiceNumber || 'invoice'}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <span
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer select-none"
        >
          {loading ? 'Preparing…' : 'Download PDF'}
        </span>
      )}
    </PDFDownloadLink>
  )
}
