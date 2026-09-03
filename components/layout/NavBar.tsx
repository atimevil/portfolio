'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { t, type Locale, type UiKey } from '@/lib/i18n'

const CORE_LINKS = [
  { href: '/', labelKey: 'blog' as UiKey },
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

  // /en에는 블로그 목록과 소개만 있다. 갤러리·책·음악·지도는 한국어 전용이라
  // 영문 화면에서 링크하면 한국어 페이지로 튕기므로 메뉴에서 뺀다.
  const koLinks = isAdmin
    ? [...CORE_LINKS, ...TOGGLABLE_LINKS.filter((l) => navVisibility?.[l.key] ?? true), ...adminOnlyLinks]
    : [...CORE_LINKS, ...TOGGLABLE_LINKS.filter((l) => navVisibility?.[l.key] ?? true)]

  const links = isEn
    ? CORE_LINKS.map((l) => ({ ...l, href: l.href === '/' ? '/en' : `/en${l.href}` }))
    : koLinks

  // 반대 로케일로 가는 경로. /en에 짝이 없는 페이지(음악·글 상세 등)에서는 /en 첫 화면으로 보낸다.
  const otherLocaleHref = isEn
    ? pathname.replace(/^\/en(?=\/|$)/, '') || '/'
    : pathname === '/about'
      ? '/en/about'
      : '/en'

  const linkClass = (href: string) =>
    isActive(pathname, href)
      ? 'text-sm font-semibold text-accent'
      : 'text-sm text-text-secondary hover:text-text-primary transition-colors'

  const localeToggle = (
    <Link
      href={otherLocaleHref}
      hrefLang={isEn ? 'ko' : 'en'}
      className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
    >
      {isEn ? 'KO' : 'EN'}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="max-w-3xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <Link
          href={isEn ? '/en' : '/'}
          className="font-semibold text-[15px] tracking-tight text-text-primary hover:text-text-primary transition-colors"
        >
          fo<span className="text-accent">xi</span>bu
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

        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={isEn ? 'Menu' : '메뉴'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-bg px-4 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              onClick={() => setMenuOpen(false)}
            >
              {t(locale, link.labelKey)}
            </Link>
          ))}
          <div className="flex items-center gap-4">
            {localeToggle}
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  )
}
