'use client'

import { useEffect } from 'react'

// 갤러리에 들어오면 화면을 따뜻한 종이 바탕으로 바꾸고, 나가면 원래 테마로 되돌린다.
// 사이트는 흑백 타일인데 갤러리만 스크랩북이라, 폴라로이드가 놓일 바탕이 따로 있어야 종이로 보인다
// (다크에선 테두리가 검은 바탕에, 라이트에선 흰 바탕에 묻혔다). 색은 globals.css의 html.gallery-paper.
// gallery-fade는 들어올 때·나갈 때 모두 0.6초로 천천히 바뀌게 하고, 나간 뒤 지워 테마 전환 속도는 그대로 둔다.
export default function GalleryScene() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('gallery-fade', 'gallery-paper')
    return () => {
      root.classList.remove('gallery-paper')
      window.setTimeout(() => {
        if (!root.classList.contains('gallery-paper')) root.classList.remove('gallery-fade')
      }, 700)
    }
  }, [])
  return null
}
