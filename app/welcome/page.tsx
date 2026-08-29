import Link from 'next/link'
import { formatBlogDate } from '@/lib/blog'
import { listPublishedPosts } from '@/lib/blog-server'
import { listActivePackages } from '@/lib/packages-server'
import { formatBillingCycle, formatDuration, getMonthlyEquivalent, type Package } from '@/lib/packages'
import BrandLogo from '@/components/BrandLogo'
import ContactForm from '@/components/ContactForm'
import MarketingHeader from '@/components/MarketingHeader'
import MarketingFooter from '@/components/MarketingFooter'

export const metadata = {
  title: 'InvoicePro – Next-Gen Invoicing & Billing for Indian Businesses',
  description:
    'Generate GST-ready tax invoices, thermal slips, and fabric lot sheets with instant UPI QR payments. Start invoicing in seconds with flexible plans.',
}

const DEFAULT_PACKAGES: Package[] = [
  {
    id: 'default-monthly',
    key: 'monthly',
    name: '1 Month Plan',
    priceInr: 299,
    durationMonths: 1,
    tagline: 'Flexible month-to-month access with all essentials.',
    features: [
      'Unlimited invoices & clients',
      'GST-ready invoice templates (CGST/SGST/IGST)',
      'UPI QR code embedded on every invoice',
      'Professional A4 PDF & 3-inch thermal receipts',
      'Fabric & textile roll/lot management',
      'Fast email & WhatsApp support',
    ],
    invoiceLimit: null,
    cta: 'Get 1 Month Plan',
    highlighted: false,
    sortOrder: 1,
    active: true,
  },
  {
    id: 'default-half-yearly',
    key: 'half-yearly',
    name: '6 Months Plan',
    priceInr: 1499,
    durationMonths: 6,
    tagline: 'Great value for active businesses — Save ~16%.',
    features: [
      'Everything in Monthly plan',
      'Save ₹295 compared to monthly billing',
      'Automatic HSN/SAC & tax calculations',
      'Multi-device access & cloud backup',
      'Priority customer assistance',
      'Custom business branding & payment info',
    ],
    invoiceLimit: null,
    cta: 'Get 6 Months Plan',
    highlighted: true,
    sortOrder: 2,
    active: true,
  },
  {
    id: 'default-yearly',
    key: 'yearly',
    name: '1 Year Plan',
    priceInr: 2699,
    durationMonths: 12,
    tagline: 'Best long-term value — Save ~25% (₹225 / month).',
    features: [
      'Everything in 6 Months plan',
      'Save ₹889 compared to monthly billing',
      'Full year uninterrupted invoicing',
      'Custom business logo & verified watermark',
      'Priority VIP feature access & support',
      'Complete invoice & client data export',
    ],
    invoiceLimit: null,
    cta: 'Get 1 Year Plan',
    highlighted: false,
    sortOrder: 3,
    active: true,
  },
]

const features = [
  {
    title: 'Instant GST & Tax Compliance',
    body: 'Automated CGST/SGST and IGST split detection by state code, with complete HSN/SAC codes and tax summary breakdowns.',
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Instant UPI QR on Every Bill',
    body: 'Clients scan with GPay, PhonePe, Paytm, or BHIM to pay instantly directly to your bank account with zero payment gateway fees.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 14.625a1.125 1.125 0 011.125-1.125h1.875v1.875h-1.875A1.125 1.125 0 0113.5 14.625zM18 13.5h2.25v2.25H18V13.5zM13.5 18h2.25v2.25H13.5V18zM18 18h2.25v2.25H18V18z" />
      </svg>
    ),
  },
  {
    title: 'Dual PDF & Thermal Slip Export',
    body: 'Download pristine vector A4 PDF invoices for corporate billing or generate 3-inch (80mm/58mm) thermal receipts for point-of-sale.',
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.04-.37-2.126-.37-3.243 0-5.18 4.254-9.375 9.5-9.375s9.5 4.195 9.5 9.375c0 1.117-.13 2.203-.37 3.243m-18.26 0A12.95 12.95 0 003 16.5c0 3.038 2.462 5.5 5.5 5.5h11c3.038 0 5.5-2.462 5.5-5.5 0-1.144-.35-2.208-.95-3.085m-18.31 0A10.97 10.97 0 0112 12.75c3.21 0 6.07 1.38 8.05 3.579" />
      </svg>
    ),
  },
  {
    title: 'Textile & Fabric Lot Invoicing',
    body: 'Specialized fabric lot entry with roll-wise meter tracking, cut pieces, weight breakdown, and production lot PDF summaries.',
    icon: (
      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: 'Party & Client Address Book',
    body: 'Save regular customers once with their GSTIN, state code, shipping addresses, and payment terms for 1-click invoice autofill.',
    icon: (
      <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Live Tracking & Instant Status',
    body: 'Track pending payments, drafts, and settled accounts in real time. Maintain crystal-clear cash flow control with zero stress.',
    icon: (
      <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

const stats = [
  { value: '< 45 sec', label: 'To create & send an invoice' },
  { value: '100% GST', label: 'Compliant tax calculation' },
  { value: '₹0 Gateway', label: 'Direct UPI bank settlement' },
  { value: '99.9%', label: 'Cloud availability & sync' },
]

const steps = [
  {
    step: '01',
    title: 'Choose Party & Items',
    desc: 'Select a saved client or type their details once. Add items with HSN/SAC codes and rates.',
  },
  {
    step: '02',
    title: 'Auto-Compute GST & UPI QR',
    desc: 'Tax splits (CGST/SGST/IGST), round-offs, and your personalized UPI QR code are generated automatically.',
  },
  {
    step: '03',
    title: 'Share PDF & Get Paid',
    desc: 'Download a clean A4 PDF or thermal slip, share over WhatsApp or email, and get paid directly to your bank account.',
  },
]

const faqs = [
  {
    q: 'What is InvoicePro and who is it built for?',
    a: 'InvoicePro is an intuitive invoicing platform designed specifically for Indian freelancers, agencies, traders, textile businesses, and small enterprise owners who want fast, GST-ready invoicing with zero accounting bloat.',
  },
  {
    q: 'Does every invoice include a scannable UPI QR code?',
    a: 'Yes! Simply save your UPI ID (VPA) and payee name in your business profile. InvoicePro automatically generates a compliant UPI payment QR on every invoice, allowing clients to scan and pay the exact total instantly.',
  },
  {
    q: 'How does the GST calculation work?',
    a: 'InvoicePro checks the seller state code and buyer state code. If both are in the same state, it calculates CGST + SGST. If inter-state, it automatically calculates IGST. You can also specify custom tax rates per item.',
  },
  {
    q: 'Can I print both A4 PDFs and Thermal POS receipts?',
    a: 'Yes! InvoicePro provides pixel-perfect vector A4 PDF downloads suitable for corporate and GST billing, as well as 3-inch (80mm/58mm) thermal receipt printing for point-of-sale and retail counters.',
  },
  {
    q: 'What are the subscription plans and how do I subscribe?',
    a: 'We offer straightforward duration-based plans: 1 Month (₹299), 6 Months (₹1,499 with ~16% savings), and 1 Year (₹2,699 with ~25% savings). You can pick your plan, pay via UPI, and submit your reference to get activated immediately.',
  },
  {
    q: 'Is my data safe and backed up in the cloud?',
    a: 'Yes. All data is securely stored on enterprise-grade Supabase Postgres infrastructure with row-level security, encrypted connections, and automated daily backups.',
  },
]

export default async function WelcomePage() {
  const [recentPosts, rawPackages] = await Promise.all([
    listPublishedPosts(3),
    listActivePackages(),
  ])

  const packages = rawPackages && rawPackages.length > 0 ? rawPackages : DEFAULT_PACKAGES

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ── Unified Marketing Header Navigation ──────────────────────────── */}
      <MarketingHeader />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle mesh background glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-400/20 via-sky-400/20 to-purple-400/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>GST-Compliant Invoicing & UPI QR Payments</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Smart Invoicing for{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                  Growing Businesses
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                Generate GST-ready invoices in seconds, attach scannable UPI payment QR codes,
                print A4 or 3-inch thermal receipts, and get paid directly to your bank account with zero gateway fees.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
                >
                  <span>Start Free Invoicing</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span>View Pricing Plans</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 border-t border-slate-200/80 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Built for Indian Enterprises & Freelancers
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Automatic CGST / SGST / IGST
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Direct UPI QR Settlement
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    A4 & Thermal 3-inch POS
                  </span>
                </div>
              </div>
            </div>

            {/* Right Live Card Showcase */}
            <div className="relative lg:col-span-5">
              {/* Decorative Card glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-xl transition duration-1000 group-hover:opacity-100" />

              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-indigo-950/10 sm:p-7">
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
                      ₹
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">TAX INVOICE</div>
                      <div className="text-base font-bold text-slate-900">INV-2026-0842</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    PAID VIA UPI
                  </span>
                </div>

                {/* Parties Details */}
                <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 text-xs">
                  <div>
                    <div className="font-semibold text-slate-400">SELLER (BILLED BY)</div>
                    <div className="mt-1 font-bold text-slate-800">Acme Creations LLP</div>
                    <div className="text-slate-500">Surat, Gujarat (24)</div>
                    <div className="text-indigo-600 font-mono mt-0.5">GSTIN: 24AAACA0000A1Z5</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-400">BUYER (BILLED TO)</div>
                    <div className="mt-1 font-bold text-slate-800">Apex Retailers Pvt Ltd</div>
                    <div className="text-slate-500">Mumbai, MH (27)</div>
                    <div className="text-indigo-600 font-mono mt-0.5">GSTIN: 27BBBCB1111B1Z2</div>
                  </div>
                </div>

                {/* Items preview table */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                    <span>ITEM & HSN</span>
                    <span>AMOUNT</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2.5 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">Cotton Fabric Rolls (Lot #402)</div>
                      <div className="text-slate-400 font-mono">HSN: 5208 · 240 Mtr @ ₹110</div>
                    </div>
                    <div className="font-bold text-slate-900">₹26,400.00</div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2.5 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">Packaging & Dispatch Handling</div>
                      <div className="text-slate-400 font-mono">HSN: 9968 · Qty: 1</div>
                    </div>
                    <div className="font-bold text-slate-900">₹1,500.00</div>
                  </div>
                </div>

                {/* Tax Breakdown & UPI QR row */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="text-xs space-y-1 text-slate-500">
                    <div className="flex justify-between gap-4">
                      <span>Taxable Subtotal:</span>
                      <span className="font-medium text-slate-700">₹27,900.00</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>IGST (5% Inter-State):</span>
                      <span className="font-medium text-slate-700">₹1,395.00</span>
                    </div>
                    <div className="flex justify-between gap-4 font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-indigo-600 font-extrabold text-base">₹29,295.00</span>
                    </div>
                  </div>

                  {/* QR Box simulation */}
                  <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 text-center">
                    <div className="h-14 w-14 rounded-lg bg-slate-900 p-1 flex items-center justify-center text-white">
                      <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v3h-3v-3zm-5 0h2v3h-2v-3zm2-5h3v2h-3v-2z" />
                      </svg>
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-indigo-700">Scan & Pay UPI</span>
                  </div>
                </div>

                {/* Floating micro badges */}
                <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-lg flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">Instant PDF Download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200/80 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold tracking-tight text-indigo-600 sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Features ────────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
              Powerful Features
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything Your Business Needs to Bill Smarter
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Stop fighting bloated software or messy spreadsheets. InvoicePro provides a fast, elegant, and fully compliant invoicing workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-indigo-50">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (3 Steps) ───────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 bg-slate-100/70 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
              Workflow
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Three Simple Steps to Get Paid Faster
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              From zero to your first professional tax invoice in under two minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="text-3xl font-black tracking-tight text-indigo-600/30">{s.step}</div>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Packages Section ─────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
              Transparent Pricing
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple, Predictable Plans with Big Savings
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Choose the duration that matches your business rhythm. All plans include full feature access and unlimited invoices.
            </p>
          </div>

          <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3">
            {packages.map((p) => {
              const isMultiMonth = p.durationMonths > 1
              const monthlyEq = getMonthlyEquivalent(p.priceInr, p.durationMonths)
              const savingsPct =
                p.durationMonths === 6
                  ? 'Save ~16%'
                  : p.durationMonths === 12
                  ? 'Save ~25% Best Value'
                  : null

              return (
                <div
                  key={p.key}
                  className={`relative flex flex-col justify-between rounded-3xl bg-white p-8 transition-all duration-200 ${
                    p.highlighted
                      ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-600/15 lg:-mt-4'
                      : 'border border-slate-200 shadow-sm hover:shadow-lg'
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-1 text-xs font-bold tracking-wide text-white shadow-md">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                      {savingsPct && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          {savingsPct}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">{p.tagline}</p>

                    <div className="mt-6 border-b border-slate-100 pb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                          ₹{p.priceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">
                          {formatBillingCycle(p.durationMonths)}
                        </span>
                      </div>
                      {isMultiMonth && (
                        <div className="mt-1.5 text-xs font-bold text-indigo-600">
                          Equivalent to ₹{monthlyEq.toLocaleString('en-IN')} / month
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Included Features
                      </div>
                      <ul className="space-y-3">
                        {p.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <Link
                      href="/login?mode=signup"
                      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                        p.highlighted
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {p.cta || `Get ${p.name}`}
                    </Link>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      Billed upfront for {formatDuration(p.durationMonths)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Blog / Resources ─────────────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <section id="blog" className="scroll-mt-20 border-t border-slate-200/80 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
                  Knowledge Hub
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  Guides & Invoicing Best Practices
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
              >
                View all articles
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">
                        {post.category}
                      </span>
                      <span className="text-slate-400">{post.readingMinutes} min read</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                  </div>
                  <span className="mt-6 text-xs font-medium text-slate-400">{formatBlogDate(post.date)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ Section ──────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
              Questions & Answers
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Got questions? We have answers. If you need further help, feel free to reach out.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-bold text-slate-900 select-none">
                  <span>{item.q}</span>
                  <svg
                    className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Section ──────────────────────────────────────────────── */}
      <section id="contact" className="scroll-mt-20 border-t border-slate-200/80 bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="inline-block rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
                Support & Inquiries
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Get in Touch With Us
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Have questions about pricing, features, or custom solutions for your enterprise? Send us a message and our team will get back to you promptly.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Us</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">contact@mobintix.app</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Call / WhatsApp</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">+91 94093 83803</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Office</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      95, Krishna Residency, Surat, Gujarat 394190
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Send a Message</h3>
                <p className="text-sm text-slate-500 mb-6">Fill in the form below and we will get back to you shortly.</p>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA Banner ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 px-8 py-16 text-center text-white shadow-2xl sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-900/40 blur-2xl" />

          <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">
            Start Sending Professional GST Invoices Today
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-base text-indigo-100 sm:text-lg">
            Create your account in 30 seconds and send your first invoice with instant UPI QR payments.
          </p>

          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-white px-7 py-3.5 text-base font-bold text-indigo-700 shadow-lg shadow-black/10 transition-all hover:bg-indigo-50 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started for Free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-indigo-400/80 bg-indigo-600/40 px-7 py-3.5 text-base font-bold text-white transition hover:bg-indigo-600/60"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <MarketingFooter />
    </div>
  )
}
