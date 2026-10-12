import { NextRequest, NextResponse } from 'next/server'
import { getViews, incrementViews } from '@/lib/views'
import { getPostBySlug } from '@/lib/blog'

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  return NextResponse.json({ views: getViews(params.slug) })
}

// 로그인 없이 부르는 API라, 게시된 글의 slug만 센다. 아무 이름이나 받으면 views.json이 끝없이 커진다.
// 키는 DB의 slug로 통일한다(URL 인코딩·유니코드 정규화가 다른 같은 글이 따로 세지지 않게).
export async function POST(_: NextRequest, { params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ views: incrementViews(post.slug) })
}
