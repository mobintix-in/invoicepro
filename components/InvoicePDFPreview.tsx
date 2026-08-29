'use client'

import { PDFViewer } from '@react-pdf/renderer'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { InvoicePDFDocument } from './InvoicePDF'
import { getMyProfile } from '@/lib/account'
import type { Invoice } from '@/types'

// Renders the EXACT same document that "Download PDF" produces, so what you
// see on screen is byte-for-byte what you download.
export default function InvoicePDFPreview({ invoice }: { invoice: Invoice }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined)
  const [enrichedInvoice, setEnrichedInvoice] = useState<Invoice>(invoice)

  useEffect(() => {
    let current = { ...invoice }

    getMyProfile().then((profile) => {
      if (profile) {
        if (!current.upiId && profile.upiId) {
          current.upiId = profile.upiId
        }
        if (!current.invoiceTheme && profile.invoiceTheme) {
          current.invoiceTheme = profile.invoiceTheme
        }
        if (!current.template && profile.template) {
          current.template = profile.template
        }
        if (!current.notes && profile.defaultInvoiceNotes) {
          current.notes = profile.defaultInvoiceNotes
        }
      }
      setEnrichedInvoice({ ...current })

      const upiId = current.upiId
      if (!upiId) {
        setQrDataUrl(undefined)
        return
      }

      const name = encodeURIComponent(current.from.name || 'Seller')
      const amount = Number(current.total || 0).toFixed(2)
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${name}&am=${amount}&cu=INR`

      QRCode.toDataURL(upiUri, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(undefined))
    }).catch(() => {
      setEnrichedInvoice({ ...current })
    })
  }, [invoice])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <PDFViewer
        showToolbar
        style={{ width: '100%', height: '85vh', border: 'none' }}
      >
        <InvoicePDFDocument invoice={enrichedInvoice} qrDataUrl={qrDataUrl} />
      </PDFViewer>
    </div>
  )
}
