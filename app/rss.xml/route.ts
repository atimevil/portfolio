import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const dynamic = 'force-dynamic'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const settings = getSettings()

  // 개발중 모드에선 (site) 레이아웃이 방문자에게 콘텐츠를 안 보내도록 막는데,
  // 이 라우트는 그 라우트 그룹 밖이라 게이트를 직접 한 번 더 건다.
  if (settings.devMode && !(await getServerSession())) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const posts = await getAllPosts()
  const { profile } = settings
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오 · 블로그'

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`
      const pubDate = new Date(post.date).toUTCString()
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(description)}</description>
    <language>ko</language>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
