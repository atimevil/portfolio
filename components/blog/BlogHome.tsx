import Link from 'next/link'
import BlogViews from '@/components/blog/BlogViews'
import Pagination from '@/components/blog/Pagination'
import { CategoryFilter, PageSizeSelect } from '@/components/blog/BlogFilters'
import SearchBox from '@/components/blog/SearchBox'
import { getAllPosts } from '@/lib/blog'
import { t, categoryLabel, blogBase, type Locale } from '@/lib/i18n'

export const DEFAULT_PER_PAGE = 10
const ALLOWED_PER_PAGE = [5, 10, 20]

export interface BlogHomeSearchParams {
  page?: string
  tag?: string
  category?: string
  perPage?: string
  q?: string
}

/**
 * 블로그 인덱스(/blog — 글은 한국어로만 쓰므로 en 짝이 없다).
 *
 * 홈(/)은 포트폴리오라 여기에 프로필이나 작업 목록은 없다. 이 페이지는 글만 다룬다.
 * 글 본문은 번역하지 않으므로 목록 자체는 ko/en이 동일하다.
 */
export default async function BlogHome({
  searchParams,
  locale = 'ko',
}: {
  searchParams: BlogHomeSearchParams
  locale?: Locale
}) {
  const tag = searchParams.tag?.trim()
  const category = searchParams.category?.trim()
  const q = searchParams.q?.trim()
  const filtering = Boolean(tag || category || q)
  const base = blogBase(locale)

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
        p.tags?.some((tagName) => tagName.toLowerCase().includes(needle))
    )
  }

  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage))
  const pagePosts = posts.slice((currentPage - 1) * perPage, currentPage * perPage)

  const extraParams = { category, tag, q, perPage: perPage !== DEFAULT_PER_PAGE ? String(perPage) : undefined }

  const filterHeading = category
    ? locale === 'en'
      ? `Category: ${categoryLabel(locale, category)}`
      : `카테고리: ${category}`
    : tag
      ? `#${tag}`
      : locale === 'en'
        ? `“${q}” ${t(locale, 'searchResult')}`
        : `"${q}" ${t(locale, 'searchResult')}`

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        {filtering ? (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{filterHeading}</h1>
            <span className="text-sm text-text-muted">
              {posts.length}
              {t(locale, 'count')}
            </span>
            <Link href={base} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              {t(locale, 'allPosts')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{t(locale, 'writing')}</h1>
            {/* 글 본문은 번역하지 않으므로 영문 방문자에게 한국어 글임을 미리 알린다 */}
            <span className="text-sm text-text-muted">
              {locale === 'en' ? t(locale, 'postsInKorean') : `${allPosts.length}${t(locale, 'count')}`}
            </span>
          </div>
        )}
      </header>

      <section>

        {/* 칩과 검색창을 한 줄에 두면 칩이 줄어들지 않아 검색창을 덮는다. 줄을 나눈다. */}
        <div className="mb-4 flex flex-col gap-3">
          <CategoryFilter
            categories={categories}
            activeCategory={category}
            extraParams={extraParams}
            totalCount={allPosts.length}
            locale={locale}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <SearchBox
              initialQuery={q}
              extraParams={{ category, tag, perPage: extraParams.perPage }}
              locale={locale}
            />
            <PageSizeSelect perPage={perPage} extraParams={{ category, tag, q }} locale={locale} />
          </div>
        </div>

        {pagePosts.length === 0 ? (
          <p className="text-text-muted py-16 text-center text-sm">
            {filtering ? t(locale, 'noMatch') : t(locale, 'noPosts')}
          </p>
        ) : (
          <BlogViews posts={pagePosts} locale={locale} />
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={base} extraParams={extraParams} />
      </section>
    </main>
  )
}
