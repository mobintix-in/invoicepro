'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FabricLotPDFDocument } from '@/components/FabricLotPDF'
import type { FabricLot } from '@/lib/fabric-production'

function safeFilePart(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function FabricLotPDFButton({ lot }: { lot: FabricLot }) {
  const [preparing, setPreparing] = useState(false)

  async function handleDownload() {
    setPreparing(true)
    try {
      const blob = await pdf(<FabricLotPDFDocument lot={lot} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Fabric-Lot-${safeFilePart(lot.lotNumber || lot.challanNumber || lot.id) || 'report'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.warn('Fabric PDF generation error:', error instanceof Error ? error.message : String(error))
      alert('Failed to generate the Fabric Production PDF.')
    } finally {
      setPreparing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={preparing}
      className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {preparing ? 'Preparing...' : 'Download PDF'}
    </button>
  )
}