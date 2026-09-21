'use client'

import { useEffect } from 'react'

/**
 * 주소의 #앵커가 가리키는 항목 안의 <details>를 펼친다.
 *
 * 홈에서 이력 한 줄을 누르면 /about#r-<id>로 온다. 스크롤만 되고 설명이 접혀 있으면
 * 한 번 더 눌러야 해서, 도착한 항목은 바로 펼쳐 둔다. 같은 페이지 안에서 앵커가
 * 바뀔 때(hashchange)도 똑같이 한다.
 *
 * 강조도 여기서 붙인다. Next의 페이지 이동은 pushState라 CSS :target이 갱신되지 않아,
 * 사이트 안에서 누르고 들어오면 :target만으로는 강조가 안 뜬다.
 */
export default function OpenTargetDetails() {
  useEffect(() => {
    const open = () => {
      const raw = window.location.hash.slice(1)
      // 누가 손으로 고친 링크처럼 %가 깨져 있으면 decodeURIComponent가 던져 페이지가 통째로 사라진다
      let id = raw
      try {
        id = decodeURIComponent(raw)
      } catch {
        // 그대로 raw로 찾는다
      }
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return
      el.querySelector('details')?.setAttribute('open', '')
      // 클래스를 뗐다 붙여 같은 항목으로 다시 와도 강조가 다시 돈다
      el.classList.remove('is-target')
      void el.offsetWidth
      el.classList.add('is-target')
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])
  return null
}
