import type { ReactNode } from 'react'
import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { t, localized, type Locale } from '@/lib/i18n'

interface Props {
  items: PortfolioItem[]
  locale?: Locale
  /** 홈처럼 바깥에서 섹션 제목을 따로 달 때는 끈다. */
  showHeading?: boolean
}

// 설명 안의 링크를 클릭 가능하게 렌더:
//  - [텍스트](URL 또는 /내부경로)  → 텍스트가 링크
//  - 맨 URL(http/https)             → URL 자체가 링크
// 내부 경로(/로 시작)는 같은 탭 Next Link, 외부는 새 탭. 나머지는 텍스트 그대로.
const LINK_CLASS = 'text-accent underline underline-offset-2 break-all hover:opacity-80'
function renderWithLinks(text: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const href = m[2] ?? m[3]
    const label = m[1] ?? m[3] // [텍스트](URL)이면 텍스트, 맨 URL이면 URL 그대로
    out.push(
      href.startsWith('/') ? (
        <Link key={key++} href={href} className={LINK_CLASS}>
          {label}
        </Link>
      ) : (
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {label}
        </a>
      ),
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// 활동 & 수상 — 간결한 목록. 연도 + 제목, 수상은 ★.
export default function AwardsGantt({ items, locale = 'ko', showHeading = true }: Props) {
  if (items.length === 0) return null

  return (
    // 홈 등에서 #awards · #r-<id>로 바로 들어온다. 고정 헤더에 가리지 않게 scroll-mt.
    <section id={showHeading ? 'awards' : undefined} className={showHeading ? 'mt-12 scroll-mt-24' : undefined}>
      {showHeading && (
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">{t(locale, 'awards')}</h2>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {items.map((it) => {
          const isAward = it.type === 'award'
          const title = localized(it, 'title', locale).trim()
          const desc = localized(it, 'description', locale).trim()
          return (
            <li key={it.id} id={`r-${it.id}`} className="target-flash -mx-2 flex scroll-mt-24 items-baseline gap-4 rounded-md px-2 py-3">
              <span className="w-28 shrink-0 whitespace-nowrap font-mono text-xs text-text-muted">{it.year.trim()}</span>
              <div className="min-w-0 flex-1">
                {desc ? (
                  <details className="group">
                    <summary className="flex items-baseline justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="text-sm leading-snug text-text-primary">
                        {isAward && <span className="text-accent">★ </span>}
                        {title}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted transition-colors group-hover:text-accent">
                        {t(locale, 'details')} <span className="inline-block transition-transform group-open:rotate-45">＋</span>
                      </span>
                    </summary>
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                      {renderWithLinks(desc)}
                    </p>
                  </details>
                ) : (
                  <span className="text-sm leading-snug text-text-primary">
                    {isAward && <span className="text-accent">★ </span>}
                    {title}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
