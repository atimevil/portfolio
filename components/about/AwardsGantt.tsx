import type { PortfolioItem } from '@/types'

interface Props {
  items: PortfolioItem[]
}

// 설명 안의 http(s) URL을 클릭 가능한 링크로 렌더(나머지는 텍스트 그대로).
function renderWithLinks(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 break-all hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

// 활동 & 수상 — 간결한 목록. 연도 + 제목, 수상은 ★.
export default function AwardsGantt({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">Awards &amp; Activity</h2>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((it) => {
          const isAward = it.type === 'award'
          return (
            <li key={it.id} className="flex items-baseline gap-4 py-3">
              <span className="w-24 shrink-0 font-mono text-xs text-text-muted">{it.year.trim()}</span>
              <div className="min-w-0 flex-1">
                {it.description?.trim() ? (
                  <details className="group">
                    <summary className="flex items-baseline justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="text-sm leading-snug text-text-primary">
                        {isAward && <span className="text-accent">★ </span>}
                        {it.title.trim()}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted transition-colors group-hover:text-accent">
                        자세히 <span className="inline-block transition-transform group-open:rotate-45">＋</span>
                      </span>
                    </summary>
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                      {renderWithLinks(it.description.trim())}
                    </p>
                  </details>
                ) : (
                  <span className="text-sm leading-snug text-text-primary">
                    {isAward && <span className="text-accent">★ </span>}
                    {it.title.trim()}
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
