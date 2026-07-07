import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

// Header used on standalone marketing pages (e.g. the blog) where the
// welcome page's in-page section anchors don't apply. Section links point
// back to the welcome page so navigation matches the landing page exactly.
export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/welcome" aria-label="InvoicePro home">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/welcome#services" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            Services
          </Link>
          <Link href="/welcome#about" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            About
          </Link>
          <Link href="/welcome#pricing" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            Pricing
          </Link>
          <Link href="/blog" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            Blog
          </Link>
          <Link href="/welcome#faq" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            FAQ
          </Link>
          <Link href="/welcome#contact" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
            Contact
          </Link>
          <span className="mx-1 hidden h-5 w-px bg-gray-200 md:inline-block" />
          <Link href="/login" className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
            Log in
          </Link>
          <Link href="/login?mode=signup" className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  )
}
