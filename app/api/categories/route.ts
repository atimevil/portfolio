import { NextRequest, NextResponse } from 'next/server'
import { parseJsonObject, badJson } from '@/lib/bulkSchema'
import { getAdminSession } from '@/lib/session'
import { getCategories, addCategory, deleteCategory } from '@/lib/categories'

export async function GET() {
  return NextResponse.json(await getCategories())
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const { name } = body
  if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  return NextResponse.json(await addCategory(name))
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const { name } = body
  if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  return NextResponse.json(await deleteCategory(name))
}
