import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MarketingHeader from '@/components/MarketingHeader'
import MarketingFooter from '@/components/MarketingFooter'
import { formatBlogDate } from '@/lib/blog'
import { getPublishedPostBySlug } from '@/lib/blog-server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) return { title: 'Post not found – InvoicePro' }
  return { title: `${post.title} – InvoicePro`, description: post.excerpt }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  // Unknown or unpublished slug → render the 404 page.
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All articles
        </Link>

        <div className="mt-6 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
            {post.category}
          </span>
          <span className="text-gray-400">{post.readingMinutes} min read</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-gray-400">{formatBlogDate(post.date)}</p>

        <div className="mt-8 space-y-5">
          <p className="text-lg font-medium text-gray-700">{post.excerpt}</p>
          {post.content.map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-gray-600">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-indigo-600 px-6 py-8 text-center">
          <h2 className="text-xl font-bold text-white">Start invoicing in minutes</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-indigo-100">
            Create GST-ready invoices and get paid over UPI with InvoicePro.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            Sign up free
          </Link>
        </div>
      </article>

      <MarketingFooter />
    </div>
  )
}
