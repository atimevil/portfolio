import { NextRequest, NextResponse } from 'next/server'
import { getViews, incrementViews } from '@/lib/views'
import { getPostBySlug } from '@/lib/blog'
import { getAdminSession } from '@/lib/session'
import { shouldCountView } from '@/lib/viewDedupe'

export async function GET(_: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  return NextResponse.json({ views: getViews(params.slug) })
}

// 로그인 없이 부르는 API라, 게시된 글의 slug만 센다. 아무 이름이나 받으면 views.json이 끝없이 커진다.
// 키는 DB의 slug로 통일한다(URL 인코딩·유니코드 정규화가 다른 같은 글이 따로 세지지 않게).
export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = await getPostBySlug(params.slug)
  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // 글쓴이가 자기 글을 확인하는 것, 같은 방문자의 재방문·새로 고침은 세지 않는다.
  // X-Real-IP는 nginx가 실제 접속 주소로 덮어쓴다(클라이언트가 못 바꾼다 — lib/auth.ts와 같은 기준).
  const ip = req.headers.get('x-real-ip')?.trim() || 'unknown'
  if ((await getAdminSession()) || !shouldCountView(ip, post.slug)) {
    return NextResponse.json({ views: getViews(post.slug) })
  }
  return NextResponse.json({ views: incrementViews(post.slug) })
}
