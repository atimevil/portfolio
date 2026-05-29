'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navLinks = [
  { href: '/', label: '블로그' },
  { href: '/about', label: '소개' },
  { href: '/gallery', label: '갤러리' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-bg border-b border-border">
      <nav className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <Link
          href="/"
          className="font-bold text-base text-text-primary hover:text-text-secondary transition-colors"
        >
          foxibu
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary"
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
