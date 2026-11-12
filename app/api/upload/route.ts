import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { stripImageMetadata } from '@/lib/stripMetadata'
import { detectImageExt } from '@/lib/imageExt'
import { PHOTO_DIR, URL_PREFIX as PHOTO_URL_PREFIX } from '@/lib/place-photos'
import { uniqueStamp } from '@/lib/uniqueStamp'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // multipart가 아닌 본문이면 formData()가 던진다 — 500 대신 400으로 답한다
  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!formData || !(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // type별로 저장 폴더를 나눈다. 정해진 값만 허용해서 경로 조작(../ 등)을 막는다.
  const type = formData.get('type')
  const subdir = type === 'blog' ? 'blog' : type === 'maps' ? 'maps' : type === 'music' ? 'music' : ''
  const prefix = subdir || 'avatar'

  const buffer = await stripImageMetadata(Buffer.from(await file.arrayBuffer()))
  // 확장자는 파일명이 아니라 실제 내용으로 정한다. 이미지가 아니면 저장하지 않는다
  const ext = await detectImageExt(buffer)
  if (!ext) return NextResponse.json({ error: '이미지 파일이 아닙니다' }, { status: 400 })
  const filename = `${prefix}-${uniqueStamp()}.${ext}`

  // 지도 사진은 비공개(로그인해야 보이는 /maps용)라 public 밖에 두고 인증 라우트로 서빙한다
  if (subdir === 'maps') {
    await mkdir(PHOTO_DIR, { recursive: true })
    await writeFile(path.join(PHOTO_DIR, filename), buffer)
    return NextResponse.json({ url: `${PHOTO_URL_PREFIX}${filename}` })
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads', subdir)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${subdir ? `${subdir}/` : ''}${filename}` })
}
