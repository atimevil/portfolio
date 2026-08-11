'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  initialQuery?: string
  /** 검색 시 함께 유지할 다른 쿼리 파라미터 (category, tag, perPage 등) */
  extraParams?: Record<string, string | undefined>
}

// 제출 시 홈으로 이동하며 q를 세팅, page는 항상 리셋. 다른 필터(category/tag/perPage)는 유지.
export default function SearchBox({ initialQuery, extraParams }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery ?? '')

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
    router.push(qs ? `/?${qs}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-[220px]">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="글 검색"
        className="w-full rounded-md border border-border bg-bg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
      />
    </form>
  )
}
