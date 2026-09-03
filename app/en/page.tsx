export const dynamic = 'force-dynamic'

import BlogHome, { type BlogHomeSearchParams } from '@/components/blog/BlogHome'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || 'Portfolio'
  return buildPageMetadata({
    path: '/en',
    title: name,
    description: 'AI/ML · LLM Agents · Security — portfolio and blog',
  })
}

export default async function EnHomePage({ searchParams }: { searchParams: BlogHomeSearchParams }) {
  return <BlogHome searchParams={searchParams} locale="en" />
}
