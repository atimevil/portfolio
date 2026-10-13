'use client'

import { useSyncExternalStore } from 'react'

// 화면 폭 판정. 서버 렌더와 첫 하이드레이션은 false(좁은 화면 기준)로 맞춰 불일치 경고를 피한다.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
