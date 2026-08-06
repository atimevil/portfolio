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

  // type별로 저장 폴더를 나눈다. 정해진 값만 허용해서 경로 조작(../ 등)을 막는다.
  const type = formData.get('type')
  const subdir = type === 'blog' ? 'blog' : type === 'food' ? 'food' : ''
  const prefix = subdir || 'avatar'

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  // 확장자도 허용 목록으로 제한 (파일명에서 온 값을 그대로 쓰지 않는다)
  const rawExt = (file.name.split('.').pop() ?? '').toLowerCase()
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(rawExt) ? rawExt : 'jpg'
  const filename = `${prefix}-${Date.now()}.${ext}`

  const uploadDir = path.join(process.cwd(), 'public/uploads', subdir)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${subdir ? `${subdir}/` : ''}${filename}` })
}
