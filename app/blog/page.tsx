import Link from 'next/link'
import MarketingHeader from '@/components/MarketingHeader'
import BrandLogo from '@/components/BrandLogo'
import { formatBlogDate } from '@/lib/blog'
import { listPublishedPosts } from '@/lib/blog-server'

export const metadata = {
  title: 'Blog – InvoicePro',
  description:
    'Practical guides on invoicing, GST compliance, and getting paid faster for small businesses.',
}

export default async function BlogIndexPage() {
  const blogPosts = await listPublishedPosts()

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <section className="border-b border-gray-100 bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            The InvoicePro blog
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ideas for billing smarter
          </h1>
          <p className="mt-3 max-w-xl text-lg text-gray-600">
            Practical guides on invoicing, GST compliance, and getting paid faster.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {blogPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center text-gray-500">
            No articles have been published yet. Check back soon.
          </div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
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
              <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-gray-500">{post.excerpt}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-400">{formatBlogDate(post.date)}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                  Read
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <Link href="/welcome" aria-label="InvoicePro home">
            <BrandLogo />
          </Link>
          <p>© {new Date().getFullYear()} InvoicePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
