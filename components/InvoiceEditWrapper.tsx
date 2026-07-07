'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import type { Invoice } from '@/types'
import { getInvoice } from '@/lib/storage'
import InvoiceForm from '@/components/InvoiceForm'

export default function InvoiceEditWrapper({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    getInvoice(id)
      .then(inv => {
        if (!inv) {
          setMissing(true)
          return
        }
        setInvoice(inv)
        setLoaded(true)
      })
      .catch(err => {
        console.warn(err?.message || 'Failed to load invoice')
        setMissing(true)
      })
  }, [id])

  // Data API failed or the invoice doesn't exist → render the 404 page.
  if (missing) notFound()

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return <InvoiceForm mode="edit" initialData={invoice!} />
}
