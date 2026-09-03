import type { PortfolioItem } from '@/types'

export type Locale = 'ko' | 'en'

export const LOCALES: Locale[] = ['ko', 'en']
export const DEFAULT_LOCALE: Locale = 'ko'

/** '/en' 이하 경로면 en, 아니면 ko */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ko'
}

/** ko 경로 ↔ en 경로 변환 (KO/EN 토글용). en에 없는 페이지는 호출부에서 제외한다. */
export function pathForLocale(pathname: string, locale: Locale): string {
  const base = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  return locale === 'en' ? (base === '/' ? '/en' : `/en${base}`) : base
}

// UI 크롬 문구. 값이 하나뿐인 항목(PROJECTS 등)은 양쪽 동일하게 둔다.
const UI = {
  blog: { ko: '블로그', en: 'Blog' },
  about: { ko: '소개', en: 'About' },
  gallery: { ko: '갤러리', en: 'Gallery' },
  books: { ko: '책', en: 'Books' },
  music: { ko: '음악', en: 'Music' },
  maps: { ko: '지도', en: 'Maps' },
  recentPosts: { ko: '최근 글', en: 'Recent Posts' },
  all: { ko: '전체', en: 'All' },
  searchPosts: { ko: '글 검색', en: 'Search posts' },
  perPage: { ko: '페이지당', en: 'Per page' },
  viewList: { ko: '목록', en: 'List' },
  viewGrid: { ko: '격자', en: 'Grid' },
  viewImage: { ko: '이미지', en: 'Image' },
  details: { ko: '자세히', en: 'Details' },
  projects: { ko: 'Projects', en: 'Projects' },
  awards: { ko: 'Awards & Activity', en: 'Awards & Activity' },
  noPosts: { ko: '글이 없습니다.', en: 'No posts yet.' },
  noMatch: { ko: '해당 분류의 글이 없습니다.', en: 'No posts match this filter.' },
  allPosts: { ko: '← 전체 글', en: '← All posts' },
  searchResult: { ko: '검색 결과', en: 'search results' },
  postsInKorean: { ko: '', en: 'Posts are in Korean.' },
  aboutArrow: { ko: '소개 →', en: 'About →' },
  count: { ko: '개', en: '' },
} as const

export type UiKey = keyof typeof UI

export function t(locale: Locale, key: UiKey): string {
  return UI[key][locale]
}

// 블로그 카테고리 라벨 — 데이터의 한국어 카테고리명을 영문 화면에서만 바꿔 보여준다.
// 사전에 없는 카테고리는 원문 그대로 노출한다(빈칸 방지).
const CATEGORY_EN: Record<string, string> = {
  알고리즘: 'Algorithms',
  자료구조: 'Data Structures',
  보안: 'Security',
  'Backend/Java': 'Backend / Java',
  Github: 'GitHub',
}

export function categoryLabel(locale: Locale, name: string): string {
  return locale === 'en' ? (CATEGORY_EN[name] ?? name) : name
}

/**
 * 항목의 로케일별 필드를 고른다. 영문 필드가 비어 있으면 한국어로 폴백해
 * 화면에 빈칸이 노출되지 않게 한다.
 */
export function localized(
  item: PortfolioItem,
  field: 'title' | 'description',
  locale: Locale
): string {
  if (locale === 'en') {
    const en = field === 'title' ? item.title_en : item.description_en
    if (en?.trim()) return en
  }
  return (field === 'title' ? item.title : item.description) ?? ''
}
