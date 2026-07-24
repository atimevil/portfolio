import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isBlog = formData.get('type') === 'blog'
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const filename = `${isBlog ? 'blog' : 'avatar'}-${Date.now()}.${ext}`

  // 블로그 이미지는 기존 관습대로 /uploads/blog/ 아래에, 아바타는 /uploads/ 바로 아래에.
  const uploadDir = path.join(process.cwd(), 'public/uploads', isBlog ? 'blog' : '')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: isBlog ? `/uploads/blog/${filename}` : `/uploads/${filename}` })
}
