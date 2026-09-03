export const dynamic = 'force-dynamic'

import BlogHome, { type BlogHomeSearchParams } from '@/components/blog/BlogHome'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오 · 블로그'
  return buildPageMetadata({ path: '', title: name, description })
}

export default async function HomePage({ searchParams }: { searchParams: BlogHomeSearchParams }) {
  return <BlogHome searchParams={searchParams} locale="ko" />
}
