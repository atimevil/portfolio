import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { hiddenFromPublic } from '@/lib/publicGate'
import { getAllBooks, createBook, updateBook, deleteBook, updateBooks, deleteBooks } from '@/lib/books'
import { IdsSchema, parseJsonBody } from '@/lib/bulkSchema'

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

// 일괄로 바꿀 수 있는 칸은 장르·상태뿐.
const BookBulkSchema = z.object({
  ids: IdsSchema,
  set: z.object({ genre: z.string().optional(), status: z.enum(['reading', 'done', 'want']).optional() })
    .strict()
    .refine((s) => Object.keys(s).length > 0, '바꿀 칸이 없습니다'),
})

export async function GET() {
  if (await hiddenFromPublic('books')) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(await getAllBooks())
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = BookSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const book = await createBook(result.data)
  revalidatePath('/books')
  return NextResponse.json(book, { status: 201 })
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
    const book = await updateBook(id, result.data)
    revalidatePath('/books')
    return NextResponse.json(book)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = BookBulkSchema.safeParse(await parseJsonBody(req))
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const count = await updateBooks(result.data.ids, result.data.set)
  revalidatePath('/books')
  return NextResponse.json({ count })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const body = (await parseJsonBody(req)) as { id?: unknown; ids?: unknown } | undefined
  if (!body || typeof body !== 'object' || ('id' in body && 'ids' in body)) {
    return NextResponse.json({ error: 'id 또는 ids 중 하나만 보내세요' }, { status: 400 })
  }

  if ('ids' in body) {
    const ids = IdsSchema.safeParse(body.ids)
    if (!ids.success) return NextResponse.json({ error: ids.error.flatten() }, { status: 400 })
    const count = await deleteBooks(ids.data)
    revalidatePath('/books')
    return NextResponse.json({ count })
  }

  if (typeof body.id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  try {
    await deleteBook(body.id)
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) throw err
  }
  revalidatePath('/books')
  return NextResponse.json({ ok: true })
}
