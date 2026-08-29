import Link from 'next/link'

export default function BrandLogo({ href = '/welcome' }: { href?: string }) {
  const content = (
    <div className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]">
      {/* Gradient App Icon with Glass Inner Glow */}
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 shadow-md shadow-indigo-600/25 ring-1 ring-white/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-600/40">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.3}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      {/* Brand Wordmark with Accent Badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Invoice<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Pro</span>
        </span>
        <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
          GST
        </span>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} aria-label="InvoicePro Home">
      {content}
    </Link>
  )
}
