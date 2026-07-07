// Pure, isomorphic blog helpers and types — no Supabase import, so this is
// safe to pull into both server components (public pages) and client
// components (the admin editor).
//
//   • Public reads   → lib/blog-server.ts (server client)
//   • Admin CRUD      → lib/blog-admin.ts (browser client)

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  date: string // ISO (created_at), used for display
  readingMinutes: number
  content: string[] // paragraphs, ready to render
  published: boolean
}

export type BlogPostRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  content: string
  reading_minutes: number
  published: boolean
  created_at: string
  updated_at: string
}

// Columns selected for the public/display shape.
export const BLOG_COLUMNS =
  'id, slug, title, excerpt, category, content, reading_minutes, published, created_at, updated_at'

/** Split a raw body (blank-line separated) into paragraphs. */
export function bodyToParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** Rough reading-time estimate at ~200 words per minute (min 1). */
export function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function rowToPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    date: row.created_at,
    readingMinutes: row.reading_minutes,
    content: bodyToParagraphs(row.content),
    published: row.published,
  }
}

export function formatBlogDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

/** Turn a title into a URL-safe slug. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
