export const dynamic = 'force-dynamic'

import AboutContent from '@/components/about/AboutContent'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

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
  return <AboutContent locale="ko" />
}
