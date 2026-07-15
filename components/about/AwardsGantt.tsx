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

// 활동 & 수상 — 하나의 가로 타임라인.
// 기간 활동 = 축 위 막대 + 위쪽 라벨 / 단발 이벤트 = 핀(점) + 아래쪽 라벨.
// 모두 같은 시간축을 공유해 시점·기간이 한눈에 비교된다.
export default function AwardsGantt({ items }: Props) {
  const evts = items
    .map((it) => ({ it, span: parseSpan(it.year) }))
    .filter(
      (r): r is { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>> } =>
        r.span !== null
    )
  if (evts.length === 0) return null

  const min = Math.min(...evts.map((r) => r.span.start))
  const max = Math.max(...evts.map((r) => r.span.end)) + 1 // 마지막 달 끝까지
  const total = Math.max(1, max - min)
  const pos = (mi: number) => ((mi - min) / total) * 100
  const center = (s: { start: number; end: number }) => (pos(s.start) + pos(s.end + 1)) / 2

  const ranges = evts.filter((e) => e.span.isRange)
  const points = evts.filter((e) => !e.span.isRange)

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
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px] px-8">
          {/* 위쪽: 기간 활동 라벨 */}
          <div className="relative h-16">
            {ranges.map(({ it, span }) => {
              const isAward = it.type === 'award'
              return (
                <div
                  key={it.id}
                  className="absolute bottom-0 w-[132px] -translate-x-1/2 text-center"
                  style={{ left: `${center(span)}%` }}
                  title={it.title.trim()}
                >
                  <div className="line-clamp-2 text-[11.5px] font-medium leading-tight text-text-primary">
                    {isAward && <span className="text-accent">★ </span>}
                    {it.title.trim()}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-accent">{it.year.trim()}</div>
                  <div className="mx-auto mt-1 h-2 w-px bg-border" />
                </div>
              )
            })}
          </div>

          {/* 축 + 막대 + 핀 */}
          <div className="relative h-5">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            {ranges.map(({ it, span }) => {
              const isAward = it.type === 'award'
              return (
                <div
                  key={it.id}
                  className={`absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full ${
                    isAward
                      ? 'bg-accent shadow-[0_0_10px_-1px_var(--color-accent)]'
                      : 'bg-accent/75'
                  }`}
                  style={{ left: `${pos(span.start)}%`, width: `${pos(span.end + 1) - pos(span.start)}%` }}
                />
              )
            })}
            {points.map(({ it, span }) => {
              const isAward = it.type === 'award'
              return (
                <div
                  key={it.id}
                  className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg ${
                    isAward ? 'bg-accent shadow-[0_0_0_3px_var(--color-accent-soft)]' : 'bg-accent/80'
                  }`}
                  style={{ left: `${pos(span.start) + (0.5 / total) * 100}%` }}
                />
              )
            })}
          </div>

          {/* 아래쪽: 단발 이벤트 라벨 */}
          <div className="relative h-16">
            {points.map(({ it }, i) => {
              const isAward = it.type === 'award'
              const span = points[i].span
              return (
                <div
                  key={it.id}
                  className="absolute top-0 w-[132px] -translate-x-1/2 text-center"
                  style={{ left: `${pos(span.start) + (0.5 / total) * 100}%` }}
                  title={it.title.trim()}
                >
                  <div className="mx-auto h-2 w-px bg-border" />
                  <div className="mt-1 line-clamp-2 text-[11.5px] font-medium leading-tight text-text-primary">
                    {isAward && <span className="text-accent">★ </span>}
                    {it.title.trim()}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-accent">{it.year.trim()}</div>
                </div>
              )
            })}
          </div>

          {/* 시간축 눈금 */}
          <div className="relative mt-1 h-4 border-t border-border">
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
              <span className="inline-block h-2 w-5 rounded-full bg-accent/75" />기간 활동
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-5 rounded-full bg-accent" />수상 기간
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent/80" />단발 이벤트
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
