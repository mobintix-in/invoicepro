'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLogo from '@/components/BrandLogo'

export default function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isWelcomePage = pathname === '/welcome' || pathname === '/'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const getHref = (anchor: string) => {
    return isWelcomePage ? `#${anchor}` : `/welcome#${anchor}`
  }

  const navLinks = [
    { label: 'Features', href: getHref('features') },
    { label: 'How it Works', href: getHref('how-it-works') },
    { label: 'Pricing', href: getHref('pricing') },
    { label: 'Knowledge Hub', href: '/blog' },
    { label: 'FAQ', href: getHref('faq') },
    { label: 'Contact', href: getHref('contact') },
  ]

  const isBlogActive = pathname.startsWith('/blog')

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo href="/welcome" />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => {
            const isActive = link.href === '/blog' && isBlogActive
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Action CTAs & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/login"
            className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-all duration-200 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-600/35 hover:-translate-y-0.5"
          >
            <span>Get started</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl md:hidden">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-bold text-white shadow-md hover:bg-indigo-700"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
