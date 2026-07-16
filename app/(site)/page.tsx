export const dynamic = 'force-dynamic'

import Link from 'next/link'
import BlogViews from '@/components/blog/BlogViews'
import Pagination from '@/components/blog/Pagination'
import ProfileHeader from '@/components/layout/ProfileHeader'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

const POSTS_PER_PAGE = 10

interface Props {
  searchParams: { page?: string; tag?: string; category?: string }
}

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오 · 블로그'
  return buildPageMetadata({ path: '', title: name, description })
}

export default async function HomePage({ searchParams }: Props) {
  const { profile } = getSettings()
  const tag = searchParams.tag?.trim()
  const category = searchParams.category?.trim()
  const filtering = Boolean(tag || category)

  let posts = getAllPosts()
  if (tag) posts = posts.filter((p) => p.tags?.includes(tag))
  if (category) posts = posts.filter((p) => p.category === category)

  // 필터 중에는 매칭 글 전부를, 평소에는 페이지네이션해서 보여준다.
  const currentPage = Number(searchParams.page ?? 1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const pagePosts = filtering
    ? posts
    : posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      {filtering ? (
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary">
            {category ? `카테고리: ${category}` : `#${tag}`}
          </h1>
          <span className="text-sm text-text-muted">{posts.length}개</span>
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            ← 전체 글
          </Link>
        </section>
      ) : (
        <ProfileHeader profile={profile} showAboutLink />
      )}

      <section>
        {!filtering && (
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">최근 글</h2>
        )}
        {pagePosts.length === 0 ? (
          <p className="text-text-muted py-16 text-center text-sm">
            {filtering ? '해당 분류의 글이 없습니다.' : '글이 없습니다.'}
          </p>
        ) : (
          <BlogViews posts={pagePosts} />
        )}
        {!filtering && <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />}
      </section>
    </main>
  )
}
