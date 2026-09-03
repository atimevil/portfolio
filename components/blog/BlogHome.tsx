import Link from 'next/link'
import BlogViews from '@/components/blog/BlogViews'
import Pagination from '@/components/blog/Pagination'
import { CategoryFilter, PageSizeSelect } from '@/components/blog/BlogFilters'
import SearchBox from '@/components/blog/SearchBox'
import ProfileHeader from '@/components/layout/ProfileHeader'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { t, categoryLabel, type Locale } from '@/lib/i18n'

export const DEFAULT_PER_PAGE = 10
const ALLOWED_PER_PAGE = [5, 10, 20]

export interface BlogHomeSearchParams {
  page?: string
  tag?: string
  category?: string
  perPage?: string
  q?: string
}

/** 한국어(/) · 영문(/en) 홈이 공유하는 글 목록. 글 본문은 번역하지 않으므로 목록 자체는 동일하다. */
export default async function BlogHome({
  searchParams,
  locale = 'ko',
}: {
  searchParams: BlogHomeSearchParams
  locale?: Locale
}) {
  const { profile } = getSettings()
  const tag = searchParams.tag?.trim()
  const category = searchParams.category?.trim()
  const q = searchParams.q?.trim()
  const filtering = Boolean(tag || category || q)
  const base = locale === 'en' ? '/en' : '/'

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
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      {filtering ? (
        <section className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary">{filterHeading}</h1>
          <span className="text-sm text-text-muted">
            {posts.length}
            {t(locale, 'count')}
          </span>
          <Link href={base} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            {t(locale, 'allPosts')}
          </Link>
        </section>
      ) : (
        <ProfileHeader profile={profile} showAboutLink locale={locale} />
      )}

      <section>
        {!filtering && (
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t(locale, 'recentPosts')}
            </h2>
            {/* 글 본문은 번역하지 않으므로 영문 방문자에게 한국어 글임을 미리 알린다 */}
            {locale === 'en' && (
              <span className="text-xs text-text-muted">{t(locale, 'postsInKorean')}</span>
            )}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CategoryFilter
            categories={categories}
            activeCategory={category}
            extraParams={extraParams}
            totalCount={allPosts.length}
            locale={locale}
          />
          <div className="flex items-center gap-3">
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
