'use client'
import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { InvoicePDFDocument } from './InvoicePDF'
import { getMyProfile } from '@/lib/account'
import type { Invoice } from '@/types'

export default function InvoicePDFButton({ invoice }: { invoice: Invoice }) {
  const [action, setAction] = useState<'download' | 'share' | null>(null)

  const fileName = `${invoice.invoiceNumber || 'invoice'}.pdf`

  /** Resolve effective invoice with profile fallback for upiId, theme & template */
  async function getResolvedInvoice(): Promise<{ inv: Invoice; qrDataUrl?: string }> {
    let current = { ...invoice }
    try {
      const profile = await getMyProfile()
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
    } catch {
      // ignore
    }

    let qrDataUrl: string | undefined = undefined
    if (current.upiId) {
      const name = encodeURIComponent(current.from.name || 'Seller')
      const amount = Number(current.total || 0).toFixed(2)
      const upiUri = `upi://pay?pa=${encodeURIComponent(current.upiId)}&pn=${name}&am=${amount}&cu=INR`
      try {
        qrDataUrl = await QRCode.toDataURL(upiUri, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 200,
          color: { dark: '#000000', light: '#ffffff' },
        })
      } catch {
        qrDataUrl = undefined
      }
    }

    return { inv: current, qrDataUrl }
  }

  const createPdfBlob = async () => {
    const { inv, qrDataUrl } = await getResolvedInvoice()
    return pdf(<InvoicePDFDocument invoice={inv} qrDataUrl={qrDataUrl} />).toBlob()
  }

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownload = async () => {
    try {
      setAction('download')
      downloadBlob(await createPdfBlob())
    } catch (err) {
      console.warn(
        'PDF generation error:',
        err instanceof Error ? err.message : String(err),
      )
      alert('Failed to generate PDF')
    } finally {
      setAction(null)
    }
  }

  const handleShare = async () => {
    try {
      setAction('share')
      const blob = await createPdfBlob()
      const file = new File([blob], fileName, { type: 'application/pdf' })
      const shareData: ShareData = {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice ${invoice.invoiceNumber} from ${invoice.from.name}`,
        files: [file],
      }

      if (
        !navigator.share ||
        (navigator.canShare && !navigator.canShare(shareData))
      ) {
        downloadBlob(blob)
        alert(
          'PDF downloaded. Attach it in WhatsApp, email, or your preferred app.',
        )
        return
      }

      await navigator.share(shareData)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.warn(
        'PDF sharing error:',
        err instanceof Error ? err.message : String(err),
      )
      alert('Could not open sharing. Please use Download PDF instead.')
    } finally {
      setAction(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={action !== null}
        className="cursor-pointer select-none rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {action === 'share' ? 'Preparing…' : 'Share PDF'}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={action !== null}
        className="cursor-pointer select-none rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {action === 'download' ? 'Preparing…' : 'Download PDF'}
      </button>
    </>
  )
}
