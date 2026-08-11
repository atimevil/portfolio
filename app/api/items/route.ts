import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getItems, createItem, updateItem, deleteItem } from '@/lib/items'

const ItemSchema = z.object({
  type: z.enum(['project', 'activity', 'award']),
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  github: z.string().optional(),
  link: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().optional(),
})

export async function GET() {
  return NextResponse.json(getItems())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = ItemSchema.safeParse(await req.json())
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  return NextResponse.json(createItem(result.data), { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  updateItem(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  deleteItem(id)
  return NextResponse.json({ ok: true })
}
