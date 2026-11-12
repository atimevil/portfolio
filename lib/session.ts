import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { passwordVersion } from '@/lib/auth-password'

export type AdminSession = { user?: { name?: string | null } }

// 관리자 로그인 확인은 전부 이 함수로 한다(페이지·API 공통).
// 로그인할 때 토큰에 적어 둔 비밀번호 버전이 지금 버전과 다르면 로그인하지 않은 것으로 본다 —
// 비밀번호를 바꾸면 그 전에 로그인해 둔 다른 기기·브라우저의 세션이 바로 끊긴다(예전엔 최대 24시간 유지됐다).
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session.pv === passwordVersion() ? session : null
}
