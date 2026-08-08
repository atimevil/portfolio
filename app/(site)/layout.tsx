import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/settings'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 세션은 두 곳에서 쓴다: devMode 차단, 그리고 관리자 전용 메뉴(맛집) 노출 여부.
  const session = await getServerSession()
  const settings = getSettings()

  // 개발중 모드: 로그인 안 한 방문자는 coming-soon으로 리다이렉트해서
  // 페이지 콘텐츠가 아예 렌더/전송되지 않게 한다 (관리자는 정상).
  if (settings.devMode && !session) redirect('/coming-soon')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar isAdmin={!!session} navVisibility={settings.navVisibility} />
      {children}
      <Footer />
    </div>
  )
}
