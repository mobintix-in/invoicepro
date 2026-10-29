import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-16 text-center selection:bg-indigo-500 selection:text-white">
      {/* Background glow mesh */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-200/40 via-amber-200/30 to-indigo-200/30 blur-3xl" />

      {/* 404 Error Logo / Icon */}
      <div className="mb-6 flex items-center justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xl shadow-rose-500/25 ring-8 ring-rose-100/70">
          <svg
            className="h-10 w-10 text-white drop-shadow-sm"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
      </div>

      <span className="inline-block rounded-full bg-rose-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200/60">
        404 — Page Not Found
      </span>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
        Lost in the Cloud?
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved, renamed, or temporarily unavailable.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Go to Invoices</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
        >
          <span>Sign In</span>
        </Link>
      </div>
    </main>
  )
}
