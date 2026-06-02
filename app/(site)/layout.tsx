import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/settings'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 개발중 모드: 로그인 안 한 방문자는 coming-soon으로 리다이렉트해서
  // 페이지 콘텐츠가 아예 렌더/전송되지 않게 한다 (관리자는 정상).
  if (getSettings().devMode) {
    const session = await getServerSession()
    if (!session) redirect('/coming-soon')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      {children}
      <Footer />
    </div>
  )
}
