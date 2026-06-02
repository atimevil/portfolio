import { getServerSession } from 'next-auth'
import { getSettings } from '@/lib/settings'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 개발중 모드: 로그인 안 한 방문자에게는 사이트를 가린다 (관리자는 정상)
  if (getSettings().devMode) {
    const session = await getServerSession()
    if (!session) {
      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Coming soon</p>
          <h1 className="text-xl font-semibold text-text-primary mb-2">사이트 준비 중입니다</h1>
          <p className="text-sm text-text-secondary mb-6">곧 공개됩니다.</p>
          <a href="/admin/login" className="text-xs text-text-muted hover:text-text-primary transition-colors">
            관리자 로그인
          </a>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      {children}
      <Footer />
    </div>
  )
}
