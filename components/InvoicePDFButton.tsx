'use client'
import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoicePDFDocument } from './InvoicePDF'
import type { Invoice } from '@/types'

export default function InvoicePDFButton({ invoice }: { invoice: Invoice }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const blob = await pdf(<InvoicePDFDocument invoice={invoice} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer select-none"
    >
      {loading ? 'Preparing…' : 'Download PDF'}
    </button>
  )
}
