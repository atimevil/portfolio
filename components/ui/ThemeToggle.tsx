'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { t, type Locale } from '@/lib/i18n'

// 스위치는 이름이 고정이고 켜짐/꺼짐(aria-checked)이 상태를 말한다 — "라이트 모드로 전환, 켜짐"처럼 서로 어긋나게 읽히지 않게
export default function ThemeToggle({ locale = 'ko' }: { locale?: Locale }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 실제 테마는 <head> 스크립트가 정한 html 클래스라 마운트 뒤에 읽는다
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function apply(next: boolean) {
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    // 저장소가 막힌 브라우저(사생활 보호 모드 등)에서는 setItem이 던진다 — 이번 화면에서만 바뀌고 기억은 못 한다
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  // 스위치 위치에서 원이 퍼지며 새 테마가 드러난다(View Transitions). 지원하지 않거나 움직임 줄이기를 켠 경우 바로 바꾼다.
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = !isDark
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) {
      apply(next)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(() => {
      flushSync(() => apply(next))
    })
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        )
      })
      .catch(() => {})
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={t(locale, 'darkMode')}
      onClick={toggle}
      // 모양은 html의 dark 클래스(<head> 스크립트가 첫 화면 전에 정함)를 따른다 — 마운트 전 기본값(다크)으로 그렸다가 튀지 않게
      className="relative inline-flex w-11 h-6 rounded-full bg-border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg dark:border dark:border-border dark:bg-surface"
    >
      <span className="absolute top-0.5 w-5 h-5 translate-x-0.5 rounded-full bg-text-primary shadow-sm transition-transform duration-200 dark:translate-x-5" />
    </button>
  )
}
