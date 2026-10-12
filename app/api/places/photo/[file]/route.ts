import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { readFile } from 'fs/promises'
import path from 'path'
import { OWN_FILE, PHOTO_DIR } from '@/lib/place-photos'

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
}

// 지도 사진은 로그인한 관리자에게만 보낸다(/maps 페이지와 같은 기준).
export async function GET(_: NextRequest, props: { params: Promise<{ file: string }> }) {
  const params = await props.params
  if (!(await getServerSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // 업로드가 만든 이름(maps-<숫자>.<확장자>)만 받는다 — "../" 같은 경로 조작 차단
  const ext = params.file.split('.').pop()?.toLowerCase() ?? ''
  if (!OWN_FILE.test(params.file) || !TYPES[ext]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const body = await readFile(path.join(PHOTO_DIR, params.file))
    return new NextResponse(body, {
      headers: { 'Content-Type': TYPES[ext], 'Cache-Control': 'private, max-age=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
