'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { t, blogBase, type Locale } from '@/lib/i18n'

interface Props {
  initialQuery?: string
  /** 검색 시 함께 유지할 다른 쿼리 파라미터 (category, tag, perPage 등) */
  extraParams?: Record<string, string | undefined>
  locale?: Locale
}

// 제출 시 홈으로 이동하며 q를 세팅, page는 항상 리셋. 다른 필터(category/tag/perPage)는 유지.
export default function SearchBox({ initialQuery, extraParams, locale = 'ko' }: Props) {
  const base = blogBase(locale)
  const router = useRouter()
  const [value, setValue] = useState(initialQuery ?? '')

  // "← 전체 글"처럼 q를 떼는 이동을 해도 이 컴포넌트는 마운트된 채로 남아 입력값이 그대로 남는다.
  // URL의 q가 바뀌면 입력창도 따라가게 맞춘다.
  useEffect(() => {
    setValue(initialQuery ?? '')
  }, [initialQuery])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (val) params.set(key, val)
      }
    }
    const q = value.trim()
    if (q) params.set('q', q)
    const qs = params.toString()
    router.push(qs ? `${base}?${qs}` : base)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative min-w-[150px] flex-1 sm:max-w-[220px] sm:flex-none">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(locale, 'searchPosts')}
        aria-label={t(locale, 'searchPosts')}
        className="w-full rounded-md border border-border bg-bg py-1.5 pl-3 pr-9 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
      />
      {/* placeholder만으로는 레이블이 안 되고, 엔터 외에 제출 수단도 없었다. */}
      <button
        type="submit"
        aria-label={t(locale, 'searchSubmit')}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  )
}
