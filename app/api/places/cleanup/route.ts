import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { findOrphanPhotos, deleteOrphanPhotos } from '@/lib/place-photos'

async function requireSession() {
  const session = await getServerSession()
  return !!session
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

/** 미사용 사진 목록 조회 (삭제하지 않음 — 먼저 보여주기 위한 것) */
export async function GET() {
  if (!(await requireSession())) return unauthorized()
  const orphans = await findOrphanPhotos()
  return NextResponse.json({
    count: orphans.length,
    bytes: orphans.reduce((sum, o) => sum + o.bytes, 0),
    files: orphans.map((o) => o.file),
  })
}

/** 미사용 사진 삭제 */
export async function DELETE() {
  if (!(await requireSession())) return unauthorized()
  return NextResponse.json(await deleteOrphanPhotos())
}
