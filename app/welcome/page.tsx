import Link from 'next/link'
import { SUBSCRIPTION } from '@/lib/subscription'

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

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <span className="text-lg font-bold tracking-tight text-gray-900">InvoicePro</span>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
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

      {/* Pricing packages */}
      <section id="pricing" className="bg-gray-50 py-16 sm:py-20">
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p>© {new Date().getFullYear()} InvoicePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
