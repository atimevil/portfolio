export const dynamic = 'force-dynamic'

import BlogHome, { type BlogHomeSearchParams } from '@/components/blog/BlogHome'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  return buildPageMetadata({
    path: '/blog',
    title: '글',
    description: '알고리즘·자료구조·보안을 공부하며 쓴 기술 글',
    languages: { ko: '/blog', en: '/en/blog' },
  })
}

export default async function BlogIndexPage({ searchParams }: { searchParams: BlogHomeSearchParams }) {
  return <BlogHome searchParams={searchParams} locale="ko" />
}
