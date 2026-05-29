'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/blog', label: '블로그' },
  { href: '/admin/projects', label: '프로젝트' },
  { href: '/admin/gallery', label: '갤러리' },
  { href: '/admin/categories', label: '카테고리' },
  { href: '/admin/settings', label: '설정' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <nav className="w-48 shrink-0 bg-bg-secondary border-r border-border flex flex-col">
        <div className="px-4 h-11 flex items-center border-b border-border">
          <span className="text-sm font-semibold text-text-primary tracking-tight">Admin</span>
        </div>

        <ul className="flex-1 py-2 px-2 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="px-2 pb-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center px-2.5 py-1.5 rounded-md text-sm text-text-muted hover:text-red-500 hover:bg-surface transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
