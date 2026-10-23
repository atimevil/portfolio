import { NextRequest, NextResponse } from 'next/server'
import { parseJsonObject, badJson } from '@/lib/bulkSchema'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getAllPostsAdmin, createPost, updatePost, deletePost } from '@/lib/blog'

const PostSchema = z.object({
  title: z.string().min(1),
  date: z.string().refine((d) => !Number.isNaN(Date.parse(d)), 'invalid date'),
  tags: z.array(z.string()),
  category: z.string().optional(),
  excerpt: z.string(),
  content: z.string(),
  contentFormat: z.enum(['markdown', 'html']).optional(),
  status: z.enum(['published', 'draft']),
})

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const posts = await getAllPostsAdmin()
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const result = PostSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  let slug: string
  try {
    slug = await createPost(result.data)
  } catch (err) {
    // slug는 서버가 빈 자리를 골라 정하므로 여기 오는 건 동시 요청 레이스뿐이다.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 })
    }
    throw err
  }
  return NextResponse.json({ ok: true, slug }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const { originalSlug, ...updates } = body
  if (typeof originalSlug !== 'string' || !originalSlug) return NextResponse.json({ error: 'originalSlug required' }, { status: 400 })
  // 모르는 키나 잘못된 타입·날짜가 DB 쓰기까지 가서 500이 나지 않게 POST와 같은 스키마로 거른다
  const result = PostSchema.partial().safeParse(updates)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  try {
    await updatePost(originalSlug, result.data)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Post not found')) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw err
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const { slug } = body
  if (typeof slug !== 'string' || !slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  await deletePost(slug)
  return NextResponse.json({ ok: true })
}
