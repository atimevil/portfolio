'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { t, pathForLocale, type Locale, type UiKey } from '@/lib/i18n'

const CORE_LINKS = [
  { href: '/blog', labelKey: 'blog' as UiKey },
  { href: '/about', labelKey: 'about' as UiKey },
]

// key는 SiteSettings.navVisibility의 필드명과 맞춘다 — 관리자가 설정에서 개별로 끄고 켤 수 있음.
const TOGGLABLE_LINKS = [
  { href: '/gallery', labelKey: 'gallery' as UiKey, key: 'gallery' },
  { href: '/books', labelKey: 'books' as UiKey, key: 'books' },
  { href: '/music', labelKey: 'music' as UiKey, key: 'music' },
] as const

// 맛집지도는 비공개 개인 도구라 로그인했을 때만 메뉴에 노출한다.
// (비로그인 방문자에겐 존재 자체가 안 보여서 로그인 벽에 부딪히는 경험이 없다)
const adminOnlyLinks = [{ href: '/maps', labelKey: 'maps' as UiKey }]

// 현재 경로가 해당 링크에 속하는지 (홈은 정확히 '/', 나머지는 접두사 매칭)
function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface Props {
  isAdmin?: boolean
  navVisibility?: { gallery: boolean; books: boolean; music: boolean }
  locale?: Locale
}

export default function NavBar({ isAdmin = false, navVisibility, locale = 'ko' }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() ?? '/'
  const isEn = locale === 'en'

  // /en에는 소개와 프로젝트 상세만 있다. 글은 한국어로만 쓰므로 영문 메뉴의
  // 글 링크도 한국어 /blog를 가리킨다. 갤러리·책·음악·지도는 한국어 전용이라 뺀다.
  const koLinks = isAdmin
    ? [...CORE_LINKS, ...TOGGLABLE_LINKS.filter((l) => navVisibility?.[l.key] ?? true), ...adminOnlyLinks]
    : [...CORE_LINKS, ...TOGGLABLE_LINKS.filter((l) => navVisibility?.[l.key] ?? true)]

  const links = isEn
    ? CORE_LINKS.map((l) => ({ ...l, href: l.href === '/blog' ? '/blog' : `/en${l.href}` }))
    : koLinks

  // 반대 로케일로 가는 경로. /en에 짝이 있는 곳(홈·소개·프로젝트 상세 /work/<slug>)은
  // 그대로 넘기고, 짝이 없는 곳(음악·글은 한국어 전용)은 /en 첫 화면으로 보낸다.
  const hasEnPair = (path: string) => path === '/' || path === '/about' || path.startsWith('/work/')
  const otherLocaleHref = isEn
    ? pathname.replace(/^\/en(?=\/|$)/, '') || '/'
    : hasEnPair(pathname)
      ? pathForLocale(pathname, 'en')
      : '/en'

  const linkClass = (href: string) =>
    isActive(pathname, href)
      ? 'text-sm font-semibold text-accent'
      : 'text-sm text-text-secondary hover:text-text-primary transition-colors'

  const localeToggle = (
    <Link
      href={otherLocaleHref}
      hrefLang={isEn ? 'ko' : 'en'}
      className="inline-flex min-h-[26px] items-center rounded border border-border px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {isEn ? 'KO' : 'EN'}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg-translucent backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-text-primary focus:ring-2 focus:ring-accent"
      >
        {isEn ? 'Skip to content' : '본문으로 건너뛰기'}
      </a>
      <nav aria-label={isEn ? 'Main' : '주 메뉴'} className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <Link
          href={isEn ? '/en' : '/'}
          className="inline-flex h-11 items-center gap-2 rounded-sm font-semibold text-[15px] tracking-tight text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span>fo<span className="text-accent">xi</span>bu</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {t(locale, link.labelKey)}
            </Link>
          ))}
          {localeToggle}
          <ThemeToggle />
        </div>

        {/* ☰/✕는 텍스트 글리프라 폰트에 따라 깨진다 → 인라인 SVG.
            터치 타겟 44px, 열림 상태는 aria-expanded로 노출. */}
        <button
          type="button"
          className="md:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={isEn ? 'Menu' : '메뉴'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* 닫혔을 때 언마운트하면 aria-controls가 없는 id를 가리킨다. 항상 렌더하고 감춘다.
          hidden 속성만으로는 부족하다 — .flex(작성자 스타일)가 UA의 [hidden]{display:none}을
          이기므로 표시 여부는 클래스로 정한다. */}
      <div
        id="mobile-menu"
        className={`md:hidden flex-col border-t border-border bg-bg px-4 py-2 ${menuOpen ? 'flex' : 'hidden'}`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-[44px] items-center ${linkClass(link.href)}`}
            onClick={() => setMenuOpen(false)}
          >
            {t(locale, link.labelKey)}
          </Link>
        ))}
        <div className="flex min-h-[44px] items-center gap-4">
          {localeToggle}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
