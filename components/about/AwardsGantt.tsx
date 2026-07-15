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
  const end = Math.max(start, monthIndex(b.y, b.m))
  return { start, end, isRange: end > start }
}

interface Props {
  items: PortfolioItem[]
}

// 활동 & 수상 가로 타임라인:
// 각 항목은 [제목 + 날짜]가 위, 그 아래 전체폭 트랙에 기간 막대(또는 단발 점).
// 모든 트랙이 같은 시간 스케일을 공유해 길이·위치가 서로 비교된다.
export default function AwardsGantt({ items }: Props) {
  const rows = items
    .map((it) => ({ it, span: parseSpan(it.year) }))
    .filter(
      (r): r is { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>> } =>
        r.span !== null
    )
    .sort((x, y) => x.span.start - y.span.start)
  if (rows.length === 0) return null

  const min = Math.min(...rows.map((r) => r.span.start))
  const max = Math.max(...rows.map((r) => r.span.end)) + 1 // 마지막 달 끝까지 채우도록 +1
  const total = Math.max(1, max - min)
  const pos = (mi: number) => ((mi - min) / total) * 100

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const mi = Math.round(min + (total * i) / 4)
    return {
      pct: (i / 4) * 100,
      label: `${Math.floor(mi / 12)}.${String((mi % 12) + 1).padStart(2, '0')}`,
    }
  })

  return (
    <section className="mt-12">
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6">Awards &amp; Activity</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="flex flex-col gap-5">
            {rows.map(({ it, span }) => {
              const isAward = it.type === 'award'
              return (
                <div key={it.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="text-sm leading-snug text-text-primary">
                      {isAward && <span className="text-accent">★ </span>}
                      {it.title.trim()}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-accent">{it.year.trim()}</span>
                  </div>
                  <div className="relative h-2.5">
                    <div className="absolute inset-0 rounded-full bg-surface" />
                    {span.isRange ? (
                      <div
                        className={`absolute inset-y-0 rounded-full ${isAward ? 'bg-accent' : 'bg-accent/55'}`}
                        style={{
                          left: `${pos(span.start)}%`,
                          width: `${((span.end - span.start + 1) / total) * 100}%`,
                        }}
                      />
                    ) : (
                      <div
                        className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${
                          isAward ? 'bg-accent shadow-[0_0_0_3px_var(--color-accent-soft)]' : 'bg-accent/70'
                        }`}
                        style={{ left: `calc(${pos(span.start) + (0.5 / total) * 100}% - 5px)` }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 시간축 */}
          <div className="relative mt-4 h-4 border-t border-border">
            {ticks.map((t, i) => (
              <span
                key={i}
                className={`absolute top-1.5 font-mono text-[10px] text-text-muted ${
                  i === 0 ? '' : i === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
                }`}
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>

          {/* 범례 */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-5 rounded-full bg-accent/55" />기간 활동
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-5 rounded-full bg-accent" />수상 기간
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />단발 이벤트
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
