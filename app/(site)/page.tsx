export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import PortfolioHome from '@/components/home/PortfolioHome'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오'
  return buildPageMetadata({
    path: '',
    title: `${name} — ${description}`,
    description,
    // 제목이 사이트명과 같아 템플릿을 태우면 "foxibu · foxibu"가 된다
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = legacyBlogQuery(searchParams)
  if (qs) redirect(`/blog?${qs}`)
  return <PortfolioHome locale="ko" />
}
