import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { getProjects, projectSlug } from '@/lib/items'
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

  // ko/en 짝이 있는 페이지는 양쪽을 다 올리고 서로를 alternates로 가리킨다.
  // /en/about은 이력서에 적힌 주소라 색인에서 빠지면 안 된다.
  const paired: MetadataRoute.Sitemap = (
    [
      ['', '/en', 1.0, 'weekly'],
      ['/about', '/en/about', 0.8, 'monthly'],
    ] as const
  ).flatMap(([ko, en, priority, changeFrequency]) => {
    const languages = { ko: `${BASE_URL}${ko || '/'}`, en: `${BASE_URL}${en}` }
    return [ko, en].map((path) => ({
      url: `${BASE_URL}${path || '/'}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages },
    }))
  })

  // 글은 한국어로만 쓴다 — /blog는 en 짝 없이 단독으로 올린다.
  const blogIndex: MetadataRoute.Sitemap = [{
    url: `${BASE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }]

  // 프로젝트 상세는 ko/en 쌍으로 올린다 — 지원서에 개별 링크를 걸 수 있는 주소다.
  const workEntries: MetadataRoute.Sitemap = getProjects().flatMap((project) => {
    const slug = projectSlug(project)
    const languages = { ko: `${BASE_URL}/work/${slug}`, en: `${BASE_URL}/en/work/${slug}` }
    return [`/work/${slug}`, `/en/work/${slug}`].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: { languages },
    }))
  })

  return [...paired, ...blogIndex, ...workEntries, ...optional, ...postEntries]
}
