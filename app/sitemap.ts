import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
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

  // 메뉴에서 끈 페이지는 색인에도 올리지 않는다 (설정의 "메뉴 노출"과 의도를 맞춤).
  const { navVisibility } = getSettings()
  const optional: MetadataRoute.Sitemap = (
    [
      ['gallery', '/gallery'],
      ['books', '/books'],
      ['music', '/music'],
    ] as const
  )
    .filter(([key]) => navVisibility[key])
    .map(([, path]) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...optional,
    ...postEntries,
  ]
}
