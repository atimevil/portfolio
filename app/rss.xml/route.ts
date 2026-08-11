import { NextResponse } from 'next/server'
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
  const posts = await getAllPosts()
  const { profile } = getSettings()
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
