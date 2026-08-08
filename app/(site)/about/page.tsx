export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { getTimeline } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  return buildPageMetadata({
    path: '/about',
    title: '소개',
    description: `${name}의 기술 스택, 활동 및 수상 내역`,
  })
}

export default async function AboutPage() {
  const settings = getSettings()
  const timeline = getTimeline()
  const { profile } = settings
  const hasEvents = timeline.length > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <ProfileHeader profile={profile} />

      {/* 활동 & 수상 — 가로 간트 (기간 시각화) */}
      {hasEvents && <AwardsGantt items={timeline.filter((i) => i.type !== 'project')} />}
    </main>
  )
}
