import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getGalleryImages, saveGalleryImage, deleteGalleryImage } from '@/lib/gallery'

export async function GET() {
  const images = getGalleryImages()
  return NextResponse.json(images)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || '기타'
  const description = (formData.get('description') as string) || ''

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const image = saveGalleryImage(buffer, file.name, category, description)
  return NextResponse.json(image, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  deleteGalleryImage(id)
  return NextResponse.json({ ok: true })
}
