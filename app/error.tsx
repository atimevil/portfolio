'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// 서버 렌더링 중 예외(대표적으로 DB가 잠시 내려갔을 때 홈·블로그)에서 Next 기본 화면 대신 보여준다.
// 헤더·푸터는 설정 파일을 서버에서 읽어야 해서 여기선 그리지 않는다 — 다시 시도·홈 링크만 둔다.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const en = usePathname()?.startsWith('/en') ?? false
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="main" className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center bg-bg px-4 py-24 md:px-8">
      <p className="font-mono text-sm text-text-muted">500</p>
      <h1 className="mt-2 page-title">
        {en ? 'Something went wrong on our side.' : '일시적인 오류가 났습니다.'}
      </h1>
      <p className="mt-3 text-text-secondary">
        {en ? 'Please try again in a moment.' : '잠시 뒤 다시 시도해 주세요.'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[40px] items-center rounded-full border border-accent px-4 text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {en ? 'Try again' : '다시 시도'}
        </button>
        <a
          href={en ? '/en' : '/'}
          className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4 text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {en ? 'Home' : '홈'}
        </a>
      </div>
    </main>
  )
}
