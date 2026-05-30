import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { BlogPost } from '@/types'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
}

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function getAllPosts(): BlogPost[] {
  ensurePostsDir()
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      const slug = file.replace(/\.mdx$/, '')
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : '',
        tags: data.tags ?? [],
        category: data.category ?? undefined,
        excerpt: data.excerpt ?? content.slice(0, 120).replace(/\n/g, ' '),
        content,
        status: data.status ?? 'published',
        readingTime: calcReadingTime(content),
      } as BlogPost
    })
    .filter((p) => p.status === 'published')
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): BlogPost | null {
  ensurePostsDir()
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? String(data.date) : '',
    tags: data.tags ?? [],
    category: data.category ?? undefined,
    excerpt: data.excerpt ?? content.slice(0, 120).replace(/\n/g, ' '),
    content,
    status: data.status ?? 'published',
    readingTime: calcReadingTime(content),
  }
}

export function getAllPostsAdmin(): BlogPost[] {
  ensurePostsDir()
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      const slug = file.replace(/\.mdx$/, '')
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : '',
        tags: data.tags ?? [],
        category: data.category ?? undefined,
        excerpt: data.excerpt ?? content.slice(0, 120).replace(/\n/g, ' '),
        content,
        status: data.status ?? 'published',
        readingTime: calcReadingTime(content),
      } as BlogPost
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function createPost(post: Omit<BlogPost, 'readingTime'>): void {
  ensurePostsDir()
  const frontmatter = matter.stringify(post.content, {
    title: post.title,
    date: post.date,
    tags: post.tags,
    ...(post.category ? { category: post.category } : {}),
    excerpt: post.excerpt,
    status: post.status,
  })
  fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.mdx`), frontmatter, 'utf-8')
}

export function updatePost(slug: string, post: Partial<Omit<BlogPost, 'readingTime'>>): void {
  ensurePostsDir()
  const existing = getPostBySlug(slug)
  if (!existing) throw new Error(`Post not found: ${slug}`)
  const merged = { ...existing, ...post }
  const frontmatter = matter.stringify(merged.content, {
    title: merged.title,
    date: merged.date,
    tags: merged.tags,
    ...(merged.category ? { category: merged.category } : {}),
    excerpt: merged.excerpt,
    status: merged.status,
  })
  const targetSlug = post.slug ?? slug
  if (post.slug && post.slug !== slug) {
    fs.unlinkSync(path.join(POSTS_DIR, `${slug}.mdx`))
  }
  fs.writeFileSync(path.join(POSTS_DIR, `${targetSlug}.mdx`), frontmatter, 'utf-8')
}

export function deletePost(slug: string): void {
  ensurePostsDir()
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}
