import Link from 'next/link'
import { t, categoryLabel, type Locale } from '@/lib/i18n'

const PAGE_SIZE_OPTIONS = [5, 10, 20]

interface CategoryFilterProps {
  categories: { name: string; count: number }[]
  activeCategory?: string
  extraParams?: Record<string, string | undefined>
  locale?: Locale
  /** "전체" 칩에 표시할 총 글 수. 카테고리 미지정 글도 포함해야 하므로 호출부에서 전체 posts.length로 넘긴다. */
  totalCount: number
}

function buildHref(overrides: Record<string, string | undefined>, extraParams?: Record<string, string | undefined>, base = '/') {
  const params = new URLSearchParams()
  const merged = { ...extraParams, ...overrides }
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

// 카테고리 필터 칩 — 전체/카테고리별 글 수, 현재 활성 카테고리는 accent로 강조.
export function CategoryFilter({ categories, activeCategory, extraParams, totalCount, locale = 'ko' }: CategoryFilterProps) {
  if (categories.length === 0) return null
  const base = locale === 'en' ? '/en' : '/'

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href={buildHref({ category: undefined, page: undefined }, extraParams, base)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !activeCategory
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-border text-text-secondary hover:text-text-primary'
        }`}
      >
        {t(locale, 'all')} {totalCount}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.name}
          href={buildHref({ category: c.name, page: undefined }, extraParams, base)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === c.name
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          {categoryLabel(locale, c.name)} {c.count}
        </Link>
      ))}
    </div>
  )
}

interface PageSizeSelectProps {
  perPage: number
  extraParams?: Record<string, string | undefined>
  locale?: Locale
}

// 페이지당 글 개수 선택 — 값을 바꾸면 1페이지로 리셋, 현재 필터(카테고리 등)는 유지.
export function PageSizeSelect({ perPage, extraParams, locale = 'ko' }: PageSizeSelectProps) {
  const base = locale === 'en' ? '/en' : '/'
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted">
      <span>{t(locale, 'perPage')}</span>
      {PAGE_SIZE_OPTIONS.map((n) => (
        <Link
          key={n}
          href={buildHref({ perPage: n === 10 ? undefined : String(n), page: undefined }, extraParams, base)}
          className={`rounded-md px-2 py-1 transition-colors ${
            perPage === n ? 'bg-accent-soft font-medium text-accent' : 'hover:text-text-primary'
          }`}
        >
          {n}
        </Link>
      ))}
    </div>
  )
}
