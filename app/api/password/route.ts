import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { verifyPassword, setPassword } from '@/lib/auth-password'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!verifyPassword(String(currentPassword ?? ''))) {
    return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 })
  }
  if (!newPassword || String(newPassword).length < 8) {
    return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
  }

  setPassword(String(newPassword))
  return NextResponse.json({ ok: true })
}
