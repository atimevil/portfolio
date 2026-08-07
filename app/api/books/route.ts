import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getAllBooks, createBook, updateBook, deleteBook } from '@/lib/books'

async function requireSession() {
  const session = await getServerSession()
  return !!session
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const BookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.string().optional(),
  status: z.enum(['reading', 'done', 'want']).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  memo: z.string().optional(),
})

export async function GET() {
  return NextResponse.json(await getAllBooks())
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = BookSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  return NextResponse.json(await createBook(result.data), { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const { id, ...updates } = await req.json()
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  const result = BookSchema.partial().safeParse(updates)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  try {
    return NextResponse.json(await updateBook(id, result.data))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const { id } = await req.json()
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  try {
    await deleteBook(id)
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) throw err
  }
  return NextResponse.json({ ok: true })
}
