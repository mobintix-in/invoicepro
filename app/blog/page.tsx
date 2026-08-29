import Link from 'next/link'
import MarketingHeader from '@/components/MarketingHeader'
import MarketingFooter from '@/components/MarketingFooter'
import { formatBlogDate, type BlogPost } from '@/lib/blog'
import { listPublishedPosts } from '@/lib/blog-server'

export const metadata = {
  title: 'Knowledge Hub & Blog – InvoicePro',
  description:
    'Practical guides on GST compliance, UPI QR payments, invoicing best practices, and growing your business.',
}

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'guide-1',
    slug: 'complete-guide-to-gst-invoicing-india',
    title: 'The Complete Guide to GST Invoicing in India: CGST, SGST, and IGST Explained',
    excerpt:
      'Understand how intra-state vs inter-state tax splits work, mandatory GSTIN rules, HSN/SAC codes, and how to create fully compliant invoices every single time.',
    category: 'GST & Compliance',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 4,
    content: [
      'Invoicing under the Goods and Services Tax (GST) regime in India requires precision.',
      'When selling goods or services within the same state (intra-state), you must charge CGST and SGST equally. When billing clients across state borders (inter-state), IGST applies.',
      'InvoicePro automates this entire process by cross-checking your business state code against your customer state code.',
    ],
    published: true,
  },
  {
    id: 'guide-2',
    slug: 'how-upi-qr-codes-speed-up-payments',
    title: 'Why Embedding Scannable UPI QR Codes Cuts Payment Delays by 70%',
    excerpt:
      'Learn how direct UPI payment QR codes eliminate payment gateway friction, remove 2-3% transaction fees, and help Indian businesses get paid within minutes.',
    category: 'Payments & Growth',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 3,
    content: [
      'Waiting days for client bank transfers or manual NEFT/IMPS entry often leads to cash flow bottlenecks.',
      'With dynamic UPI QR codes printed directly on invoice PDFs and receipts, customers simply scan and authenticate with GPay, PhonePe, or Paytm.',
      'Settlement is immediate and directly reaches your linked business bank account with zero intermediate commission.',
    ],
    published: true,
  },
  {
    id: 'guide-3',
    slug: 'textile-and-lot-wise-invoicing-tips',
    title: 'Managing Fabric Roll & Lot Invoicing: A Practical Playbook for Textile Businesses',
    excerpt:
      'From roll-wise meter tracking and cut pieces to weight calculations and transport dispatch notes, discover how modern textile hubs in Surat streamline billing.',
    category: 'Industry Solutions',
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 5,
    content: [
      'Textile manufacturing, processing, and wholesale trade in textile hubs like Surat and Ahmedabad require specialized invoicing nuances.',
      'Unlike standard commodity sales, fabric lots consist of multiple rolls of varying meterage, grey quality specifications, cut pieces, shrinkage allowances, and transport dispatch terms.',
      'Generating an invoice requires recording individual lot numbers, total roll counts, net meters, transport courier or transport broker name, delivery LR numbers, and destination stations.',
      'InvoicePro includes dedicated Fabric Lot production and invoice fields, enabling textile merchants to generate comprehensive lot-wise packing slips and GST invoices from a single dashboard.',
    ],
    published: true,
  },
  {
    id: 'guide-4',
    slug: 'get-invoices-paid-faster',
    title: '5 Ways to Get Your Invoices Paid Faster in India',
    excerpt:
      'Late payments choke small businesses. These five practical habits shorten the gap between sending an invoice and seeing the money land.',
    category: 'Payments & Growth',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 4,
    content: [
      'Getting paid on time is less about chasing and more about removing friction. The easier you make it for a client to pay, the sooner they will.',
    ],
    published: true,
  },
  {
    id: 'guide-5',
    slug: 'gst-invoice-guide-india',
    title: 'A Simple Step-by-Step Guide to GST Invoices in India',
    excerpt:
      'GSTIN, state codes, place of supply — a plain-English walkthrough of what a compliant GST invoice actually needs.',
    category: 'GST & Compliance',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 6,
    content: [
      'A GST invoice is not just a bill — it is the document that lets your customer claim input tax credit (ITC), so getting the details right matters to both of you.',
    ],
    published: true,
  },
  {
    id: 'guide-6',
    slug: 'upi-payments-small-business',
    title: 'How UPI QR Codes Are Revolutionizing Payment Collection for Indian SMBs',
    excerpt:
      'Instant, low-cost, and ubiquitous — why adding a UPI QR code to your invoice is the single highest-ROI upgrade to your cash flow.',
    category: 'Payments & Growth',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 3,
    content: [
      'For years, collecting payment meant sharing bank details, waiting for NEFT settlement windows, or accepting cheques that took days to clear.',
    ],
    published: true,
  },
]

export default async function BlogIndexPage() {
  const fetchedPosts = await listPublishedPosts()
  const posts = fetchedPosts && fetchedPosts.length > 0 ? fetchedPosts : FALLBACK_POSTS
  const featuredPost = posts[0]
  const otherPosts = posts.slice(1)

  const categories = Array.from(new Set(posts.map((p) => p.category)))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <MarketingHeader />

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 py-16 sm:py-20">
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-300/30 to-purple-300/30 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              InvoicePro Knowledge Hub
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Ideas & Guides for{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Billing Smarter
              </span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 sm:text-xl">
              Practical guides on GST compliance, automated tax calculations, UPI settlements, and business cash-flow management.
            </p>

            {/* Categories filter pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                All Topics ({posts.length})
              </span>
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Featured Top Post */}
        {featuredPost && (
          <div className="mb-14">
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-indigo-600">
              Featured Article
            </div>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group relative block overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl sm:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 font-bold text-indigo-700 border border-indigo-100">
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {featuredPost.readingMinutes} min read
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">{formatBlogDate(featuredPost.date)}</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors sm:text-3xl">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-4 text-base leading-relaxed text-slate-600">
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-indigo-600">
                    <span>Read complete guide</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>

                <div className="hidden lg:col-span-4 lg:flex justify-center">
                  <div className="relative flex h-44 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-100 p-6 text-center">
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-slate-700">Verified Tax & Invoicing Guide</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Other Articles Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">All Recent Articles</h3>
          <span className="text-xs font-semibold text-slate-500">{posts.length} articles published</span>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {otherPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 border border-indigo-100">
                    {post.category}
                  </span>
                  <span className="text-slate-400 font-medium">{post.readingMinutes} min read</span>
                </div>

                <h4 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h4>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-400">{formatBlogDate(post.date)}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Read article
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Mid-page Newsletter / Pro-Tips Card ─────────────────────────── */}
        <div className="mt-20 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Boost Your Productivity
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Ready to automate your billing workflow?
              </h3>
              <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                Join thousands of businesses generating GST-compliant invoices and receiving instant UPI settlements with InvoicePro.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-600/50"
              >
                Create Free Account
              </Link>
              <Link
                href="/welcome#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                Explore Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
