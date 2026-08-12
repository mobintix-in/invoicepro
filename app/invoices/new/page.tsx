import InvoiceForm from '@/components/InvoiceForm'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ fabricLot?: string }>
}) {
  const { fabricLot } = await searchParams

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <InvoiceForm mode="new" fabricLotId={fabricLot} />
    </main>
  )
}
