import { createClient } from '@/lib/supabase/server'
import { BLOG_COLUMNS, rowToPost, type BlogPost, type BlogPostRow } from '@/lib/blog'

// Server-side reads for the public blog. Only ever returns published posts,
// so drafts stay hidden even from admins browsing the public pages. On any
// error (e.g. the table/migration not applied yet) it degrades to empty.

export async function listPublishedPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = await createClient()
  let query = supabase
    .from('blog_posts')
    .select(BLOG_COLUMNS)
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error || !data) return []
  return (data as BlogPostRow[]).map(rowToPost)
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(BLOG_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error || !data) return null
  return rowToPost(data as BlogPostRow)
}
