import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Post, Tag, PostTag, Category } from '@prisma/client'
import type { BlogPost } from '@/types'

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// 요약(미리보기)용: 마크다운 문법 기호를 벗겨 순수 텍스트로.
export function stripMarkdown(md: string): string {
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
const EXCERPT_LEN = 130
export function truncateExcerpt(text: string): string {
  if (text.length <= EXCERPT_LEN) return text
  const cut = text.slice(0, EXCERPT_LEN)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > EXCERPT_LEN * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${trimmed.trimEnd()}…`
}

type PostWithRelations = Post & {
  tags: (PostTag & { tag: Tag })[]
  category: Category | null
}

function toBlogPost(post: PostWithRelations, opts: { includeCover?: boolean } = {}): BlogPost {
  const result: BlogPost = {
    slug: post.slug,
    title: post.title,
    date: post.date.toISOString().slice(0, 10),
    tags: post.tags.map((pt) => pt.tag.name),
    category: post.category?.name,
    excerpt: truncateExcerpt(stripMarkdown(post.excerpt || post.content)),
    content: post.content,
    status: post.status as 'published' | 'draft',
    readingTime: calcReadingTime(post.content),
  }
  if (opts.includeCover) {
    const coverMatch = post.content.match(/!\[[^\]]*\]\(([^)\s]+)/)
    result.cover = coverMatch ? coverMatch[1] : undefined
  }
  return result
}

const include = {
  tags: { include: { tag: true } },
  category: true,
} satisfies Prisma.PostInclude

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    include,
    orderBy: { date: 'desc' },
  })
  return posts.map((p) => toBlogPost(p, { includeCover: true }))
}

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const posts = await prisma.post.findMany({
    include,
    orderBy: { date: 'desc' },
  })
  return posts.map((p) => toBlogPost(p, { includeCover: true }))
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  let post = await prisma.post.findUnique({ where: { slug }, include })
  if (!post) {
    const normalized = slug.normalize('NFC')
    if (normalized !== slug) {
      post = await prisma.post.findUnique({ where: { slug: normalized }, include })
    }
  }
  if (!post) return null
  return toBlogPost(post)
}

async function upsertCategoryId(
  tx: Prisma.TransactionClient,
  name: string | undefined
): Promise<number | null | undefined> {
  if (name === undefined) return undefined
  if (!name) return null
  const category = await tx.category.upsert({
    where: { name },
    create: { name },
    update: {},
  })
  return category.id
}

async function replaceTags(tx: Prisma.TransactionClient, postId: number, tagNames: string[]): Promise<void> {
  await tx.postTag.deleteMany({ where: { postId } })
  for (const tagName of tagNames) {
    const tag = await tx.tag.upsert({ where: { name: tagName }, create: { name: tagName }, update: {} })
    await tx.postTag.create({ data: { postId, tagId: tag.id } })
  }
}

export async function createPost(post: Omit<BlogPost, 'readingTime'>): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const categoryId = (await upsertCategoryId(tx, post.category)) ?? null

    const created = await tx.post.create({
      data: {
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        date: new Date(post.date),
        status: post.status,
        categoryId,
      },
    })

    await replaceTags(tx, created.id, post.tags)
  })
}

export async function updatePost(slug: string, post: Partial<Omit<BlogPost, 'readingTime'>>): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.post.findUnique({ where: { slug } })
    if (!existing) throw new Error(`Post not found: ${slug}`)

    const categoryId = await upsertCategoryId(tx, post.category)

    await tx.post.update({
      where: { id: existing.id },
      data: {
        slug: post.slug ?? undefined,
        title: post.title ?? undefined,
        content: post.content ?? undefined,
        excerpt: post.excerpt ?? undefined,
        date: post.date ? new Date(post.date) : undefined,
        status: post.status ?? undefined,
        categoryId,
      },
    })

    if (post.tags) {
      await replaceTags(tx, existing.id, post.tags)
    }
  })
}

export async function deletePost(slug: string): Promise<void> {
  try {
    await prisma.post.delete({ where: { slug } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return
    throw err
  }
}
