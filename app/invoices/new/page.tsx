import InvoiceForm from '@/components/InvoiceForm'

export default function NewInvoicePage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <InvoiceForm mode="new" />
    </main>
  )
}
