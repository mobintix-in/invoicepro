'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice } from '@/app/lib/types'
import { getInvoice } from '@/app/lib/storage'
import InvoiceForm from '@/app/components/InvoiceForm'

export default function InvoiceEditWrapper({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getInvoice(id).then(inv => {
      if (!inv) {
        router.replace('/')
        return
      }
      setInvoice(inv)
      setLoaded(true)
    })
  }, [id, router])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return <InvoiceForm mode="edit" initialData={invoice!} />
}
