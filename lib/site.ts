import type { Metadata } from 'next'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://foxibu.is-a.dev'
export const SITE_NAME = 'foxibu'
export const OG_IMAGE = '/opengraph-image'

/**
 * Build per-page metadata: title/description, canonical URL, and matching
 * OpenGraph + Twitter card fields.
 *
 * @param path absolute path beginning with '/', or '' for the home page
 */
export function buildPageMetadata({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}): Metadata {
  const url = `${SITE_URL}${path || '/'}`
  return {
    title,
    description,
    // types까지 여기서 같이 넣는 이유: Next 메타데이터는 최상위 필드 단위로 교체돼서,
    // 페이지가 alternates를 정의하면 루트 레이아웃의 alternates(RSS 링크)가 통째로 사라진다.
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': `${SITE_URL}/rss.xml` },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}
