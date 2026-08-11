export const dynamic = 'force-dynamic'

import Link from 'next/link'
import BlogViews from '@/components/blog/BlogViews'
import Pagination from '@/components/blog/Pagination'
import { CategoryFilter, PageSizeSelect } from '@/components/blog/BlogFilters'
import SearchBox from '@/components/blog/SearchBox'
import ProfileHeader from '@/components/layout/ProfileHeader'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

const DEFAULT_PER_PAGE = 10
const ALLOWED_PER_PAGE = [5, 10, 20]

interface Props {
  searchParams: { page?: string; tag?: string; category?: string; perPage?: string; q?: string }
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
  const q = searchParams.q?.trim()
  const filtering = Boolean(tag || category || q)

  const perPageParsed = Number(searchParams.perPage)
  const perPage = ALLOWED_PER_PAGE.includes(perPageParsed) ? perPageParsed : DEFAULT_PER_PAGE

  const allPosts = await getAllPosts()

  // 카테고리 목록은 현재 필터와 무관하게 전체 글 기준으로 집계 (필터바가 항상 안정적으로 보이도록)
  const categoryCounts = new Map<string, number>()
  for (const p of allPosts) {
    if (p.category) categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1)
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  let posts = allPosts
  if (tag) posts = posts.filter((p) => p.tags?.includes(tag))
  if (category) posts = posts.filter((p) => p.category === category)
  if (q) {
    const needle = q.toLowerCase()
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.excerpt?.toLowerCase().includes(needle) ||
        p.tags?.some((t) => t.toLowerCase().includes(needle))
    )
  }

  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage))
  const pagePosts = posts.slice((currentPage - 1) * perPage, currentPage * perPage)

  const extraParams = { category, tag, q, perPage: perPage !== DEFAULT_PER_PAGE ? String(perPage) : undefined }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      {filtering ? (
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary">
            {category ? `카테고리: ${category}` : tag ? `#${tag}` : `"${q}" 검색 결과`}
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">최근 글</h2>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CategoryFilter
            categories={categories}
            activeCategory={category}
            extraParams={extraParams}
            totalCount={allPosts.length}
          />
          <div className="flex items-center gap-3">
            <SearchBox initialQuery={q} extraParams={{ category, tag, perPage: extraParams.perPage }} />
            <PageSizeSelect perPage={perPage} extraParams={{ category, tag, q }} />
          </div>
        </div>

        {pagePosts.length === 0 ? (
          <p className="text-text-muted py-16 text-center text-sm">
            {filtering ? '해당 분류의 글이 없습니다.' : '글이 없습니다.'}
          </p>
        ) : (
          <BlogViews posts={pagePosts} />
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" extraParams={extraParams} />
      </section>
    </main>
  )
}
