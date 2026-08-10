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
  const [loadError, setLoadError] = useState<string | null>(null)

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
      .catch(() => {
        setLoadError('Could not load this invoice. Please check your connection and try again.')
        setLoaded(true)
      })
  }, [id])

  if (missing) notFound()

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return <InvoiceForm mode="edit" initialData={invoice!} />
}
