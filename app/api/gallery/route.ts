import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getGalleryImages, saveGalleryImage, deleteGalleryImage } from '@/lib/gallery'
import { isPdf, pdfFirstPageToPng } from '@/lib/pdfToImage'

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
  const buffer = Buffer.from(await file.arrayBuffer())

  // PDF(포스터 등)는 첫 페이지를 PNG로 바꿔 일반 이미지와 똑같이 저장한다.
  if (file.type === 'application/pdf') {
    if (!isPdf(buffer)) return NextResponse.json({ error: 'Invalid PDF' }, { status: 400 })
    let png: Buffer
    try {
      png = await pdfFirstPageToPng(buffer)
    } catch {
      return NextResponse.json({ error: 'PDF 변환에 실패했습니다' }, { status: 422 })
    }
    const name = file.name.replace(/\.pdf$/i, '') + '.png'
    return NextResponse.json(saveGalleryImage(png, name, category, description), { status: 201 })
  }

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

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
