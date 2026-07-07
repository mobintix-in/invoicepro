import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

// Shared footer for all public marketing pages (welcome + blog) so the
// navigation, credits, and copyright stay identical across the site.
export default function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
        <Link href="/welcome" aria-label="InvoicePro home">
          <BrandLogo />
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/welcome#services" className="transition-colors hover:text-gray-900">Services</Link>
          <Link href="/welcome#about" className="transition-colors hover:text-gray-900">About</Link>
          <Link href="/welcome#pricing" className="transition-colors hover:text-gray-900">Pricing</Link>
          <Link href="/blog" className="transition-colors hover:text-gray-900">Blog</Link>
          <Link href="/welcome#contact" className="transition-colors hover:text-gray-900">Contact</Link>
        </nav>
        <p className="text-center sm:text-right">
          © {new Date().getFullYear()} InvoicePro
          <span className="mx-1.5 text-gray-300">·</span>
          Developed by{' '}
          <a
            href="https://www.mobintix.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Mobintix Infotech
          </a>
        </p>
      </div>
    </footer>
  )
}
