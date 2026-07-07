import Link from 'next/link'
import { SUBSCRIPTION } from '@/lib/subscription'
import { formatBlogDate } from '@/lib/blog'
import { listPublishedPosts } from '@/lib/blog-server'
import BrandLogo from '@/components/BrandLogo'
import ContactForm from '@/components/ContactForm'

export const metadata = {
  title: 'InvoicePro – Simple invoicing for your business',
  description:
    'Create GST-ready invoices, share UPI-payable PDFs, and get paid faster. Pick a plan and start in minutes.',
}

type Package = {
  name: string
  price: number
  tagline: string
  features: string[]
  cta: string
  highlighted: boolean
}

// Starter is anchored to the real subscription price so the CTA stays truthful.
const packages: Package[] = [
  {
    name: 'Starter',
    price: SUBSCRIPTION.priceInr,
    tagline: 'For freelancers & solo founders getting started.',
    features: [
      'Up to 50 invoices / month',
      'Professional PDF export',
      'UPI QR on every invoice',
      'Single user',
      'Email support',
    ],
    cta: 'Start with Starter',
    highlighted: false,
  },
  {
    name: 'Business',
    price: 799,
    tagline: 'For growing teams that bill clients every day.',
    features: [
      'Unlimited invoices',
      'GST-ready invoice templates',
      'Client & contact management',
      'Up to 5 team members',
      'Priority support',
    ],
    cta: 'Choose Business',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 1999,
    tagline: 'For established companies that need control & scale.',
    features: [
      'Everything in Business',
      'Unlimited team members',
      'Custom branding & templates',
      'Dedicated account manager',
      'API & webhook access',
    ],
    cta: 'Talk to sales',
    highlighted: false,
  },
]

const features = [
  {
    title: 'Invoice in seconds',
    body: 'Fill a clean form, and a polished, print-ready invoice is generated instantly.',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'GST-ready templates',
    body: 'State codes, GSTIN, and tax breakdowns handled the way Indian businesses need.',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Get paid over UPI',
    body: 'Every invoice carries a scannable UPI QR so clients can pay in a single tap.',
    path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
  },
  {
    title: 'Download as PDF',
    body: 'What you see on screen is exactly what downloads — a pixel-perfect PDF, every time.',
    path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  },
]

const services = [
  {
    title: 'Invoice creation',
    body: 'Build professional invoices from a simple form — numbering, dates, and totals handled for you.',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'GST & tax compliance',
    body: 'CGST/SGST/IGST splits, GSTIN, and state codes so every invoice is compliant by default.',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Payment collection',
    body: 'A UPI QR on every invoice means clients pay by scanning — instantly and with a reference.',
    path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8',
  },
  {
    title: 'Client management',
    body: 'Save client details once and reuse them — no re-typing addresses and GSTINs every time.',
    path: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z',
  },
  {
    title: 'PDF export & sharing',
    body: 'Download or share a pixel-perfect PDF that matches the on-screen preview exactly.',
    path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  },
  {
    title: 'Status tracking',
    body: 'See at a glance what is a draft, sent, or paid, and keep your cash flow under control.',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
]

const stats = [
  { value: '5 min', label: 'To your first invoice' },
  { value: 'GST', label: 'Ready templates' },
  { value: 'UPI', label: 'Instant payments' },
  { value: '24/7', label: 'Access anywhere' },
]

export default async function WelcomePage() {
  const recentPosts = await listPublishedPosts(3)

  return (
    <div className="min-h-screen bg-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <BrandLogo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="#services" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
              Services
            </Link>
            <Link href="#about" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
              About
            </Link>
            <Link href="#pricing" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
              Pricing
            </Link>
            <Link href="/blog" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
              Blog
            </Link>
            <Link href="#contact" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 md:inline-flex">
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

      {/* Hero / showcase */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Invoicing for modern businesses
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Invoices that get you paid,{' '}
              <span className="text-indigo-600">faster.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Create GST-ready invoices, attach a UPI QR, and share a pixel-perfect PDF
              in minutes. Everything your Invoice Business needs, in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Get started
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                See packages
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Log in
              </Link>
            </p>
          </div>

          {/* Showcase: a mock invoice */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Invoice
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">INV-0042</div>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Paid
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-400">From</div>
                  <div className="mt-1 font-medium text-gray-900">Acme Studio</div>
                  <div className="text-gray-500">Ahmedabad, GJ</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Bill to</div>
                  <div className="mt-1 font-medium text-gray-900">Nova Retail Pvt Ltd</div>
                  <div className="text-gray-500">Mumbai, MH</div>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {[
                  ['Website design', '₹18,000'],
                  ['Brand identity kit', '₹9,500'],
                  ['Hosting (annual)', '₹4,200'],
                ].map(([item, amount]) => (
                  <div key={item} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item}</span>
                    <span className="font-medium text-gray-900">{amount}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Total</span>
                  <span className="text-xl font-bold text-gray-900">₹31,700</span>
                </div>
              </div>
            </div>
            {/* Decorative accent behind the card */}
            <div className="absolute -right-6 -top-6 -z-10 h-32 w-32 rounded-full bg-indigo-200/50 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.path} />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-16 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Services
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Everything you need to bill and get paid
            </h2>
            <p className="mt-3 text-gray-600">
              From the first invoice to the final payment, InvoicePro covers the whole cycle.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20 lg:px-8">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              About us
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Built for small businesses, not accountants
            </h2>
            <p className="mt-4 text-gray-600">
              InvoicePro started with a simple frustration: invoicing tools were either
              bloated accounting suites or bare spreadsheets. We wanted something in
              between — fast enough to use between meetings, yet compliant enough for
              Indian GST.
            </p>
            <p className="mt-4 text-gray-600">
              Today we help freelancers and growing teams send clean, professional
              invoices and collect payments over UPI without friction. No jargon, no
              clutter — just invoices that get paid.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
                <div className="mt-1 text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing packages */}
      <section id="pricing" className="scroll-mt-16 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Simple pricing for every stage
            </h2>
            <p className="mt-3 text-gray-600">
              Three plans built for the Invoice Business. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-sm ${
                  p.highlighted
                    ? 'border-2 border-indigo-600 shadow-lg lg:-mt-4'
                    : 'border border-gray-200'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-medium text-gray-400">/ month</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login?mode=signup"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    p.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {recentPosts.length > 0 && (
      <section id="blog" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              From the blog
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Ideas for billing smarter
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all articles
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                  {post.category}
                </span>
                <span className="text-gray-400">{post.readingMinutes} min read</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-gray-500">{post.excerpt}</p>
              <span className="mt-5 text-xs text-gray-400">{formatBlogDate(post.date)}</span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Contact */}
      <section id="contact" className="scroll-mt-16 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Contact
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Talk to us
            </h2>
            <p className="mt-3 text-gray-600">
              Questions about a plan, a demo, or your account? Send us a message and
              we&apos;ll get back to you within one business day.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">contact@mobintix.app</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <div className="text-sm text-gray-500">+91 94093 83803</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">Office</div>
                  <div className="text-sm text-gray-500">95, Krishna Residency, Surat, Gujarat 394190</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-indigo-600 px-8 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to send your first invoice?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Create an account and start billing clients in the next five minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-indigo-400 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <BrandLogo />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="#services" className="transition-colors hover:text-gray-900">Services</Link>
            <Link href="#about" className="transition-colors hover:text-gray-900">About</Link>
            <Link href="#pricing" className="transition-colors hover:text-gray-900">Pricing</Link>
            <Link href="/blog" className="transition-colors hover:text-gray-900">Blog</Link>
            <Link href="#contact" className="transition-colors hover:text-gray-900">Contact</Link>
          </nav>
          <p>© {new Date().getFullYear()} InvoicePro</p>
        </div>
      </footer>
    </div>
  )
}
