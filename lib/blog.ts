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

// 요약(미리보기)용: 마크다운 문법 기호를 벗겨 순수 텍스트로.
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // 코드 펜스
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '') // 헤딩 (앞 공백 허용, 후행 공백 옵션)
    .replace(/^[ \t]*>\s?/gm, '') // 인용
    .replace(/^[ \t]*[-*+]\s+/gm, '') // 불릿
    .replace(/^[ \t]*\d+\.\s+/gm, '') // 번호 목록
    .replace(/#{2,}/g, ' ') // 남은 ## ### 덩어리
    .replace(/[*_~`]/g, '') // 남은 강조/코드 기호
    .replace(/\s+/g, ' ')
    .trim()
}

// 요약을 목표 길이로 자르되 단어 경계에서 끊고, 실제로 잘렸을 때만 말줄임표를 붙인다.
// (그냥 slice만 하면 문장이 어중간하게 끝나 보이는 문제가 있었음)
const EXCERPT_LEN = 130
function truncateExcerpt(text: string): string {
  if (text.length <= EXCERPT_LEN) return text
  const cut = text.slice(0, EXCERPT_LEN)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > EXCERPT_LEN * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${trimmed.trimEnd()}…`
}

export function getAllPosts(): BlogPost[] {
  ensurePostsDir()
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      const slug = file.replace(/\.mdx$/, '')
      const coverMatch = content.match(/!\[[^\]]*\]\(([^)\s]+)/)
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : '',
        tags: data.tags ?? [],
        category: data.category ?? undefined,
        excerpt: truncateExcerpt(stripMarkdown(String(data.excerpt ?? content))),
        content,
        status: data.status ?? 'published',
        readingTime: calcReadingTime(content),
        cover: data.thumbnail ?? (coverMatch ? coverMatch[1] : undefined),
      } as BlogPost
    })
    .filter((p) => p.status === 'published')
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

// URL route params for Korean slugs can arrive percent-encoded or in a
// different Unicode normalization (NFD) than the NFC filenames on disk, so an
// exact `${slug}.mdx` lookup misses. Resolve the real filename robustly.
function resolvePostFile(slug: string): string | null {
  // Candidate raw strings: as-given and percent-decoded (decode may throw on
  // a stray '%', so guard it).
  const raws = [slug]
  try {
    const decoded = decodeURIComponent(slug)
    if (decoded !== slug) raws.push(decoded)
  } catch {
    /* not encoded — ignore */
  }

  // Direct existence check across both normalizations (fast path).
  for (let i = 0; i < raws.length; i++) {
    const forms = [raws[i], raws[i].normalize('NFC'), raws[i].normalize('NFD')]
    for (let j = 0; j < forms.length; j++) {
      if (fs.existsSync(path.join(POSTS_DIR, `${forms[j]}.mdx`))) {
        return `${forms[j]}.mdx`
      }
    }
  }

  // Fallback: scan the directory and match on NFC-normalized stems.
  const wanted = raws.map((r) => r.normalize('NFC'))
  const match = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .find((f) => wanted.indexOf(f.replace(/\.mdx$/, '').normalize('NFC')) !== -1)
  return match ?? null
}

export function getPostBySlug(slug: string): BlogPost | null {
  ensurePostsDir()
  const fileName = resolvePostFile(slug)
  if (!fileName) return null
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf-8')
  const { data, content } = matter(raw)
  const resolvedSlug = fileName.replace(/\.mdx$/, '')
  return {
    slug: resolvedSlug,
    title: data.title ?? resolvedSlug,
    date: data.date ? String(data.date) : '',
    tags: data.tags ?? [],
    category: data.category ?? undefined,
    excerpt: truncateExcerpt(stripMarkdown(String(data.excerpt ?? content))),
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
      const coverMatch = content.match(/!\[[^\]]*\]\(([^)\s]+)/)
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : '',
        tags: data.tags ?? [],
        category: data.category ?? undefined,
        excerpt: truncateExcerpt(stripMarkdown(String(data.excerpt ?? content))),
        content,
        status: data.status ?? 'published',
        readingTime: calcReadingTime(content),
        cover: data.thumbnail ?? (coverMatch ? coverMatch[1] : undefined),
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
