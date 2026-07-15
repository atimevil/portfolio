import type { PortfolioItem } from '@/types'

interface Props {
  items: PortfolioItem[]
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
              <span className="text-sm leading-snug text-text-primary">
                {isAward && <span className="text-accent">★ </span>}
                {it.title.trim()}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
