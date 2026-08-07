import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Post, Tag, PostTag, Category } from '@prisma/client'
import type { BlogPost } from '@/types'
import { slugify } from '@/lib/slug'

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// 요약(미리보기)용: 마크다운 문법 기호를 벗겨 순수 텍스트로.
export function stripMarkdown(md: string): string {
  return md
    .replace(/<[^>]+>/g, ' ') // HTML 태그 (무손실 html 글 본문/excerpt 대응)
    .replace(/```[\s\S]*?```/g, ' ') // 코드 펜스
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/\\([*_~`])/g, '$1') // 이스케이프된 강조 기호("\*" 등) → 기호만 남기고 백슬래시 제거
    .replace(/[*_~`]/g, '') // 강조/코드 기호 (헤딩·목록 판별보다 먼저 벗겨야 "**1\." 같은 패턴도 잡힘)
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '') // 헤딩 (앞 공백 허용, 후행 공백 옵션)
    .replace(/^[ \t]*>\s?/gm, '') // 인용
    .replace(/^[ \t]*[-+]\s+/gm, '') // 불릿 (*는 위에서 이미 제거됨)
    .replace(/^[ \t]*\d+\\?\.\s+/gm, '') // 번호 목록 (WYSIWYG 내보내기가 "1\." 처럼 이스케이프하는 경우 포함)
    .replace(/#{2,}/g, ' ') // 남은 ## ### 덩어리
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
    contentFormat: post.contentFormat === 'html' ? 'html' : 'markdown',
    status: post.status as 'published' | 'draft',
    readingTime: calcReadingTime(post.content),
  }
  if (opts.includeCover) {
    const coverMatch =
      post.content.match(/!\[[^\]]*\]\(([^)\s]+)/) ?? // markdown 이미지
      post.content.match(/<img[^>]+src=["']([^"']+)/) // html 이미지
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
  // slug 후보를 순서대로 조회한다:
  //  1) 원본
  //  2) percent-decode — /admin/* 은 미들웨어 뒤라 Next이 params.slug를 URL 디코딩하지 않은 채
  //     페이지로 넘긴다(공개 페이지는 미들웨어 밖이라 디코딩됨). 그래서 한글 slug 편집이 404났음.
  //  3) 각 후보의 NFC 정규화형(한글 조합/분해 방어)
  const candidates: string[] = [slug]
  try {
    const decoded = decodeURIComponent(slug)
    if (decoded !== slug) candidates.push(decoded)
  } catch {
    // 잘못된 % 시퀀스는 무시(원본으로만 시도)
  }
  for (const c of [...candidates]) {
    const nfc = c.normalize('NFC')
    if (!candidates.includes(nfc)) candidates.push(nfc)
  }

  for (const c of candidates) {
    const post = await prisma.post.findUnique({ where: { slug: c }, include })
    if (post) return toBlogPost(post)
  }
  return null
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

// base로 시작하는 기존 slug를 한 번에 읽어와서 base, base-2, base-3... 중 빈 자리를 고른다.
// startsWith라 무관한 slug(예: base="hello"일 때 "hello-world")도 섞여 들어오지만,
// `base-<숫자>` 형태와만 비교하므로 결과에는 영향이 없다.
async function resolveUniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const existing = await tx.post.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  })
  const taken = new Set(existing.map((p) => p.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function createPost(
  post: Omit<BlogPost, 'readingTime' | 'slug' | 'contentFormat'> & {
    slug?: string
    contentFormat?: 'markdown' | 'html'
  }
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const categoryId = (await upsertCategoryId(tx, post.category)) ?? null
    // slug를 명시적으로 준 경우(마이그레이션 스크립트)는 그대로 쓴다 — 충돌하면 DB unique 제약이 P2002로 막는다.
    const slug = post.slug ?? (await resolveUniqueSlug(tx, slugify(post.title)))

    const created = await tx.post.create({
      data: {
        slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        date: new Date(post.date),
        status: post.status,
        contentFormat: post.contentFormat ?? 'markdown',
        categoryId,
      },
    })

    await replaceTags(tx, created.id, post.tags)
    return slug
  })
}

export async function updatePost(
  slug: string,
  post: Partial<Omit<BlogPost, 'readingTime' | 'slug'>>
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.post.findUnique({ where: { slug } })
    if (!existing) throw new Error(`Post not found: ${slug}`)

    const categoryId = await upsertCategoryId(tx, post.category)

    await tx.post.update({
      where: { id: existing.id },
      data: {
        title: post.title ?? undefined,
        content: post.content ?? undefined,
        excerpt: post.excerpt ?? undefined,
        date: post.date ? new Date(post.date) : undefined,
        status: post.status ?? undefined,
        contentFormat: post.contentFormat ?? undefined,
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
