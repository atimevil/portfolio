import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL as BASE_URL } from '@/lib/site'

// DB(Prisma) 데이터가 필요해 빌드 시점엔 정적 생성이 불가능하다 (Docker 빌드 컨테이너엔 DB 연결이 없음) — 요청마다 렌더한다
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...postEntries,
  ]
}
