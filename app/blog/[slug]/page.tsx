import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MarketingHeader from '@/components/MarketingHeader'
import MarketingFooter from '@/components/MarketingFooter'
import { formatBlogDate, type BlogPost } from '@/lib/blog'
import { getPublishedPostBySlug, listPublishedPosts } from '@/lib/blog-server'

const FALLBACK_POSTS: Record<string, BlogPost> = {
  'complete-guide-to-gst-invoicing-india': {
    id: 'guide-1',
    slug: 'complete-guide-to-gst-invoicing-india',
    title: 'The Complete Guide to GST Invoicing in India: CGST, SGST, and IGST Explained',
    excerpt:
      'Understand how intra-state vs inter-state tax splits work, mandatory GSTIN rules, HSN/SAC codes, and how to create fully compliant invoices every single time.',
    category: 'GST & Compliance',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 4,
    content: [
      'Invoicing under the Goods and Services Tax (GST) regime in India requires strict adherence to mandatory legal parameters.',
      'The primary determination in Indian GST billing is whether a transaction is Intra-State or Inter-State. When both the supplier (seller) and recipient (buyer) are located within the same state (matching 2-digit GST state codes), CGST (Central GST) and SGST (State GST) are applied equally (e.g., 9% + 9% for an 18% tax slab).',
      'When the buyer is in a different state, the entire tax component is billed as IGST (Integrated GST) at the full rate (e.g., 18%).',
      'Mandatory elements on every GST Tax Invoice include: your business legal name, registered address, GSTIN, invoice serial number, date of issue, recipient details (with GSTIN if registered), HSN/SAC classification codes for each line item, taxable value, tax rates, total tax breakdown, and clear bank or UPI payment details.',
      'With InvoicePro, tax calculations are executed automatically in real time based on state codes, eliminating calculation errors and ensuring 100% audit-readiness.',
    ],
    published: true,
  },
  'how-upi-qr-codes-speed-up-payments': {
    id: 'guide-2',
    slug: 'how-upi-qr-codes-speed-up-payments',
    title: 'Why Embedding Scannable UPI QR Codes Cuts Payment Delays by 70%',
    excerpt:
      'Learn how direct UPI payment QR codes eliminate payment gateway friction, remove 2-3% transaction fees, and help Indian businesses get paid within minutes.',
    category: 'Payments & Growth',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    readingMinutes: 3,
    content: [
      'Cash flow is the lifeblood of any business, yet collecting invoice payments remains a major operational hurdle.',
      'Traditional bank transfers (NEFT/RTGS/IMPS) require clients to manually add beneficiaries, copy long account numbers, IFSC codes, and wait for cooling periods before sending funds.',
      'By embedding an authentic, dynamic UPI QR code on every invoice PDF and receipt, clients can immediately scan the QR code with any UPI app on their phone (Google Pay, PhonePe, Paytm, BHIM, or CRED).',
      'The exact total amount and your business VPA are pre-filled, so the client only has to enter their UPI PIN. Funds land instantly in your primary bank account with zero intermediary commission fees.',
    ],
    published: true,
  },
  'textile-and-lot-wise-invoicing-tips': {
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
  'get-invoices-paid-faster': {
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
      'First, send the invoice the moment the work is done. Every day you wait to invoice is a day added to when you get paid. Automating invoice creation removes that delay entirely.',
      'Second, set clear, short payment terms. "Net 30" is a habit, not a law — many businesses happily accept "Net 7" or "Due on receipt" when stated up front.',
      'Third, attach a payment method the client can act on instantly. A UPI QR code on the invoice turns payment from a chore into a single scan.',
      'Finally, keep your invoices clean and unambiguous. A clear invoice number, itemized work, and a single obvious total leave no room for questions.',
    ],
    published: true,
  },
  'gst-invoice-guide-india': {
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
      'At a minimum, a compliant tax invoice needs your GSTIN, the invoice number and date, the customer details, a description of goods or services, the taxable value, and the tax charged — split into CGST/SGST or IGST depending on the place of supply.',
      'Consecutive, unique invoice numbers are a mandatory requirement. Gaps or duplicates draw questions during tax reconciliation, so an automated sequential numbering system saves real headaches.',
    ],
    published: true,
  },
  'upi-payments-small-business': {
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
      'The advantage for a small business is not just speed — it is certainty. The moment a client scans your QR and confirms, the money is in your account and you both have an immediate reference number.',
      'Because a UPI QR encodes the exact amount and your VPA, there is no room for a mistyped figure or wrong account.',
    ],
    published: true,
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = (await getPublishedPostBySlug(slug)) || FALLBACK_POSTS[slug]
  if (!post) return { title: 'Article Not Found – InvoicePro' }
  return {
    title: `${post.title} – InvoicePro Knowledge Hub`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = (await getPublishedPostBySlug(slug)) || FALLBACK_POSTS[slug]

  if (!post) notFound()

  const allPosts = await listPublishedPosts(4)
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <MarketingHeader />

      {/* ── Breadcrumb & Article Header ──────────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 transition hover:text-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Knowledge Hub
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-bold text-indigo-700 border border-indigo-100">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readingMinutes} min read
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{formatBlogDate(post.date)}</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>

          {/* Author / Editorial Bar */}
          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-sm">
              IP
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">InvoicePro Research & Editorial</div>
              <div className="text-xs text-slate-500">Verified GST & Business Billing Guide</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Article Content ──────────────────────────────────────────────── */}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Key Takeaway Callout */}
        <div className="mb-10 rounded-2xl border-l-4 border-indigo-600 bg-indigo-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">Summary & Overview</div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-indigo-950">
                {post.excerpt}
              </p>
            </div>
          </div>
        </div>

        {/* Paragraphs */}
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-slate-700">
          {post.content.map((para, i) => (
            <p key={i} className="text-slate-700 leading-8">
              {para}
            </p>
          ))}
        </div>

        {/* ── In-Article CTA Banner ───────────────────────────────────────── */}
        <div className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-8 sm:p-10 text-white shadow-xl text-center sm:text-left">
          <div className="grid gap-6 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-8">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Start Invoicing in Seconds
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Ready to create your GST invoice?
              </h3>
              <p className="mt-2 text-sm text-indigo-100 sm:text-base">
                Join thousands of Indian businesses generating GST-compliant invoices with scannable UPI QR codes today.
              </p>
            </div>
            <div className="sm:col-span-4 flex justify-center sm:justify-end">
              <Link
                href="/login?mode=signup"
                className="inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 hover:shadow-xl hover:-translate-y-0.5"
              >
                Sign Up for Free
              </Link>
            </div>
          </div>
        </div>

        {/* ── Related Articles ────────────────────────────────────────────── */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t border-slate-200 pt-10">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Related Guides & Articles</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-200"
                >
                  <div>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                      {r.category}
                    </span>
                    <h4 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {r.title}
                    </h4>
                  </div>
                  <span className="mt-4 text-[11px] text-slate-400 font-medium">
                    {formatBlogDate(r.date)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <MarketingFooter />
    </div>
  )
}
