import InvoiceEditWrapper from '@/app/components/InvoiceEditWrapper'

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <InvoiceEditWrapper id={id} />
    </main>
  )
}
