import InvoicePreview from '@/app/components/InvoicePreview'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <InvoicePreview id={id} />
    </main>
  )
}
