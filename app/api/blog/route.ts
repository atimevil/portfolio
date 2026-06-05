import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getAllPostsAdmin, createPost, updatePost, deletePost } from '@/lib/blog'

const PostSchema = z.object({
  slug: z.string().min(1),
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
  const posts = getAllPostsAdmin()
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const result = PostSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  createPost(result.data)
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { originalSlug, ...updates } = await req.json()
  if (!originalSlug) return NextResponse.json({ error: 'originalSlug required' }, { status: 400 })
  updatePost(originalSlug, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  deletePost(slug)
  return NextResponse.json({ ok: true })
}
