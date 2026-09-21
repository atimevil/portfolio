'use client'

import { useEffect, useState } from 'react'

/**
 * 홈 왼쪽의 섹션 목차. 지금 보고 있는 섹션을 표시한다.
 *
 * 화면 위쪽 1/3 선을 지나가는 섹션을 "현재"로 본다. 목차가 고정돼 따라다니는데
 * 모두 같은 모양이면 어디쯤 읽고 있는지 알 수 없어서다.
 */
export default function SectionNav({ label, sections }: { label: string; sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      // 위에서 1/3 지점의 가로선 하나만 감지 영역으로 둔다
      { rootMargin: '-33% 0px -66% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    // 마지막 섹션이 짧으면 기준선까지 못 올라와 영영 선택되지 않는다. 바닥에 닿으면 마지막으로.
    const atBottom = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setActive(sections[sections.length - 1]?.id)
      }
    }
    window.addEventListener('scroll', atBottom, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', atBottom)
    }
  }, [sections])

  return (
    <nav aria-label={label} className="mt-10 hidden lg:block">
      <ul className="flex flex-col gap-1">
        {sections.map((s) => {
          const on = s.id === active
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={on ? 'true' : undefined}
                className={`group inline-flex min-h-[28px] items-center gap-3 text-sm transition-colors ${
                  on ? 'font-medium text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-px transition-all ${on ? 'w-10 bg-accent' : 'w-6 bg-border group-hover:w-10 group-hover:bg-accent'}`}
                />
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
