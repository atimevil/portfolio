'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navLinks = [
  { href: '/', label: '블로그' },
  { href: '/about', label: '소개' },
  { href: '/gallery', label: '갤러리' },
]

// 맛집지도는 비공개 개인 도구라 로그인했을 때만 메뉴에 노출한다.
// (비로그인 방문자에겐 존재 자체가 안 보여서 로그인 벽에 부딪히는 경험이 없다)
const adminOnlyLinks = [{ href: '/maps', label: '가고 싶은 곳' }]

// 현재 경로가 해당 링크에 속하는지 (홈은 정확히 '/', 나머지는 접두사 매칭)
function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function NavBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() ?? '/'

  const links = isAdmin ? [...navLinks, ...adminOnlyLinks] : navLinks

  const linkClass = (href: string) =>
    isActive(pathname, href)
      ? 'text-sm font-semibold text-accent'
      : 'text-sm text-text-secondary hover:text-text-primary transition-colors'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="max-w-3xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <Link
          href="/"
          className="font-semibold text-[15px] tracking-tight text-text-primary hover:text-text-primary transition-colors"
        >
          fo<span className="text-accent">xi</span>bu
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
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
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      )}
    </header>
  )
}
