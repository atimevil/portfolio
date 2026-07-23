import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCategories, addCategory, deleteCategory } from '@/lib/categories'

export async function GET() {
  return NextResponse.json(await getCategories())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  return NextResponse.json(await addCategory(name))
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  return NextResponse.json(await deleteCategory(name))
}
