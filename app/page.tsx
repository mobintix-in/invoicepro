import InvoiceList from '@/app/components/InvoiceList'

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track all your invoices
        </p>
      </div>
      <InvoiceList />
    </main>
  )
}
