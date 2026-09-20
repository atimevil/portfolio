export const dynamic = 'force-dynamic'

import BlogHome, { type BlogHomeSearchParams } from '@/components/blog/BlogHome'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  return buildPageMetadata({
    path: '/en/blog',
    title: 'Writing',
    description: 'Technical notes on algorithms, data structures and security',
    languages: { ko: '/blog', en: '/en/blog' },
  })
}

export default async function EnBlogIndexPage({ searchParams }: { searchParams: BlogHomeSearchParams }) {
  return <BlogHome searchParams={searchParams} locale="en" />
}
