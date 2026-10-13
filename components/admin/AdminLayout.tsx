'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminLayoutProps {
  children: React.ReactNode
  // 음악·책 표처럼 열이 많은 화면만 넓힌다. 다른 관리자 화면은 읽기 좋은 폭(max-w-3xl) 그대로.
  wide?: boolean
}

const navItems = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/blog', label: '블로그' },
  { href: '/admin/books', label: '책' },
  { href: '/admin/music', label: '음악' },
  { href: '/admin/items', label: '이력' },
  { href: '/admin/gallery', label: '갤러리' },
  { href: '/admin/categories', label: '카테고리' },
  { href: '/admin/settings', label: '설정' },
]

export default function AdminLayout({ children, wide = false }: AdminLayoutProps) {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  // 휴대폰(md 미만)에선 사이드바가 화면 대부분을 차지해서, 메뉴를 위쪽 가로 스크롤 줄로 바꾼다
  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row">
      <nav className="md:w-48 shrink-0 bg-bg-secondary border-b md:border-b-0 md:border-r border-border flex flex-col">
        <div className="px-4 h-11 flex items-center justify-between border-b border-border">
          <span className="text-sm font-semibold text-text-primary tracking-tight">Admin</span>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
              title="사이트 보기"
            >
              사이트 ↗
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="md:hidden text-xs text-text-muted hover:text-red-500 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        <ul className="md:flex-1 py-2 px-2 flex md:flex-col gap-0.5 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={`flex items-center px-2.5 py-2 md:py-1.5 rounded-md whitespace-nowrap text-sm transition-colors ${
                    active
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden md:block px-2 pb-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center px-2.5 py-1.5 rounded-md text-sm text-text-muted hover:text-red-500 hover:bg-surface transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* 넓은 화면은 overflow-x-clip — overflow-auto는 스크롤 컨테이너를 만들어 옆 패널의 sticky가 죽는다(실제 스크롤은 window) */}
      <main className={`flex-1 min-w-0 ${wide ? 'overflow-x-clip' : 'overflow-auto'}`}>
        <div className={`${wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 py-5 md:px-8 md:py-8`}>
          {children}
        </div>
      </main>
    </div>
  )
}
