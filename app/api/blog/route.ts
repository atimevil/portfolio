import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getAllPostsAdmin, createPost, updatePost, deletePost } from '@/lib/blog'

const PostSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  tags: z.array(z.string()),
  category: z.string().optional(),
  excerpt: z.string(),
  content: z.string(),
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
  const body = await req.json()
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
  const { originalSlug, ...updates } = await req.json()
  if (!originalSlug) return NextResponse.json({ error: 'originalSlug required' }, { status: 400 })
  await updatePost(originalSlug, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  await deletePost(slug)
  return NextResponse.json({ ok: true })
}
