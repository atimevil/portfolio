export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import PortfolioHome from '@/components/home/PortfolioHome'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || 'Portfolio'
  return buildPageMetadata({
    path: '/en',
    title: `${name} — AI/ML · LLM Agents · Security`,
    description: 'AI/ML · LLM Agents · Security — portfolio and blog',
    absoluteTitle: true,
    languages: { ko: '/', en: '/en' },
  })
}


/** 글 목록이 /에 있던 시절의 링크(/?category=…, /?tag=…, /?q=…, /?page=2)를 살린다. */
const BLOG_PARAMS = ['category', 'tag', 'q', 'page', 'perPage'] as const

function legacyBlogQuery(searchParams: Record<string, string | string[] | undefined>): string | null {
  const params = new URLSearchParams()
  for (const key of BLOG_PARAMS) {
    const value = searchParams[key]
    if (typeof value === 'string' && value) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? qs : null
}

export default async function EnHomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = legacyBlogQuery(searchParams)
  if (qs) redirect(`/blog?${qs}`)
  return <PortfolioHome locale="en" />
}
