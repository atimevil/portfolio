import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/settings'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

// 한국어 (site) 레이아웃과 같은 껍데기 — devMode 차단 규칙도 동일하게 적용한다.
export default async function EnLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  const settings = getSettings()

  if (settings.devMode && !session) redirect('/coming-soon')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar isAdmin={!!session} navVisibility={settings.navVisibility} locale="en" />
      {children}
      <Footer email={settings.profile.email} />
    </div>
  )
}
