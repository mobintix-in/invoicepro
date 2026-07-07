import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base text-gray-500">
        We couldn&apos;t load what you were looking for. It may have been moved,
        deleted, or the data couldn&apos;t be fetched.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Back to Invoices
      </Link>
    </main>
  )
}
