'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LangToggle from '@/components/ui/LangToggle'

export default function NavBar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { href: `/${locale}`, label: t('blog') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/gallery`, label: t('gallery') },
  ]

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        scrolled ? 'bg-bg/80 backdrop-blur-sm border-b border-border shadow-sm' : 'bg-bg'
      }`}
    >
      <nav className="max-w-content mx-auto flex items-center justify-between h-12 px-4 md:px-8">
        <Link
          href={`/${locale}`}
          className="font-bold text-lg text-text-primary hover:text-primary transition-colors"
        >
          foxibu
        </Link>

        {/* 데스크탑 네비게이션 */}
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
          <LangToggle />
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* 모바일 드롭다운 */}
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
          </div>
        </div>
      )}
    </header>
  )
}
