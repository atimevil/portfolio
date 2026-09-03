'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'

interface Props {
  initialQuery?: string
  /** 검색 시 함께 유지할 다른 쿼리 파라미터 (category, tag, perPage 등) */
  extraParams?: Record<string, string | undefined>
  locale?: Locale
}

// 제출 시 홈으로 이동하며 q를 세팅, page는 항상 리셋. 다른 필터(category/tag/perPage)는 유지.
export default function SearchBox({ initialQuery, extraParams, locale = 'ko' }: Props) {
  const base = locale === 'en' ? '/en' : '/'
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
    <form onSubmit={handleSubmit} className="relative w-full max-w-[220px]">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(locale, 'searchPosts')}
        className="w-full rounded-md border border-border bg-bg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
      />
    </form>
  )
}
