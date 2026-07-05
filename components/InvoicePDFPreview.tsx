'use client'

import { PDFViewer } from '@react-pdf/renderer'
import { InvoicePDFDocument } from './InvoicePDF'
import type { Invoice } from '@/types'

// Renders the EXACT same document that "Download PDF" produces, so what you
// see on screen is byte-for-byte what you download.
export default function InvoicePDFPreview({ invoice }: { invoice: Invoice }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <PDFViewer
        showToolbar
        style={{ width: '100%', height: '85vh', border: 'none' }}
      >
        <InvoicePDFDocument invoice={invoice} />
      </PDFViewer>
    </div>
  )
}
