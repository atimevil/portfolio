'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={toggle}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-muted ${
        isDark ? 'bg-surface border border-border' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${
          isDark
            ? 'translate-x-5 bg-text-primary'
            : 'translate-x-0.5 bg-text-primary'
        }`}
      />
    </button>
  )
}
