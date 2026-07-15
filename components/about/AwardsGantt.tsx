import type { PortfolioItem } from '@/types'

// "2025.03~09" / "2025.10~11" / "2026.01~02" / "2025.04" 를 월 인덱스 구간으로.
function monthIndex(y: number, m: number) {
  return y * 12 + (m - 1)
}
function parseSpan(raw: string): { start: number; end: number; isRange: boolean } | null {
  const s = raw.replace(/\s/g, '')
  const parts = s.split(/[~–]/)
  const pym = (str: string) => {
    const [y, m] = str.split('.')
    return { y: parseInt(y, 10), m: m ? parseInt(m, 10) : 1 }
  }
  const a = pym(parts[0])
  if (Number.isNaN(a.y)) return null
  let b = a
  if (parts.length >= 2 && parts[1] !== '') {
    const parsed = parts[1].includes('.') ? pym(parts[1]) : { y: a.y, m: parseInt(parts[1], 10) }
    if (!Number.isNaN(parsed.m)) b = parsed
  }
  const start = monthIndex(a.y, a.m)
  const end = monthIndex(b.y, b.m)
  return { start, end: Math.max(start, end), isRange: end > start }
}

interface Props {
  items: PortfolioItem[]
}

// 활동 & 수상을 가로 간트로: 왼쪽 라벨 + 오른쪽 시간축 위 막대(기간)/점(단발).
export default function AwardsGantt({ items }: Props) {
  const rows = items
    .map((it) => ({ it, span: parseSpan(it.year) }))
    .filter((r): r is { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>> } => r.span !== null)
  if (rows.length === 0) return null

  const min = Math.min(...rows.map((r) => r.span.start))
  const max = Math.max(...rows.map((r) => r.span.end)) + 1 // 끝에 1개월 여백
  const total = Math.max(1, max - min)

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const mi = Math.round(min + (total * i) / 4)
    const y = Math.floor(mi / 12)
    const m = (mi % 12) + 1
    return { pct: (i / 4) * 100, label: `'${String(y).slice(2)}.${String(m).padStart(2, '0')}` }
  })

  return (
    <section className="mt-12">
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">Awards &amp; Activity</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex flex-col gap-3">
            {rows.map(({ it, span }) => {
              const isAward = it.type === 'award'
              const leftPct = ((span.start - min) / total) * 100
              const widthPct = ((span.end - span.start + 1) / total) * 100
              return (
                <div key={it.id} className="flex items-center gap-4">
                  <div className="w-48 shrink-0 text-right text-[13px] leading-tight text-text-primary">
                    {isAward && <span className="text-accent">★ </span>}
                    {it.title}
                  </div>
                  <div className="relative h-6 flex-1">
                    <div className="absolute inset-0 rounded bg-surface/50" />
                    {span.isRange ? (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full ${isAward ? 'bg-accent' : 'bg-accent/55'}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={it.description || it.year}
                      />
                    ) : (
                      <div
                        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-bg ${
                          isAward ? 'bg-accent shadow-[0_0_0_3px_var(--color-accent-soft)]' : 'bg-accent/70'
                        }`}
                        style={{ left: `calc(${leftPct}% - 6px)` }}
                        title={it.description || it.year}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 시간축 */}
          <div className="mt-2 flex items-start gap-4">
            <div className="w-48 shrink-0" />
            <div className="relative h-4 flex-1 border-t border-border">
              {ticks.map((t, i) => (
                <span
                  key={i}
                  className="absolute top-1 -translate-x-1/2 font-mono text-[10px] text-text-muted"
                  style={{ left: `${t.pct}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex items-center gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-5 rounded-full bg-accent/55" />기간 활동
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-5 rounded-full bg-accent" />수상 기간
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />단발
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
