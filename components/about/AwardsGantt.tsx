'use client'

import { useMemo, useState } from 'react'
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
type Evt = { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>> }

// 활동 & 수상 가로 타임라인 + 연도 탭 필터.
// [전체]/[연도] 버튼으로 보기 전환. 연도 선택 시 그 해(1~12월)로 축을 맞추고
// 해당 연도에 걸치는 항목만, 막대는 그 해 범위로 잘라서 보여준다.
export default function AwardsGantt({ items }: Props) {
  const evts = useMemo<Evt[]>(
    () =>
      items
        .map((it) => ({ it, span: parseSpan(it.year) }))
        .filter((r): r is Evt => r.span !== null),
    [items]
  )

  const years = useMemo(() => {
    const set = new Set<number>()
    evts.forEach((e) => {
      for (let y = Math.floor(e.span.start / 12); y <= Math.floor(e.span.end / 12); y++) set.add(y)
    })
    return [...set].sort((a, b) => a - b)
  }, [evts])

  const [year, setYear] = useState<number | null>(null)

  const { min, max } = useMemo(() => {
    if (year !== null) return { min: monthIndex(year, 1), max: monthIndex(year + 1, 1) }
    return {
      min: Math.min(...evts.map((e) => e.span.start)),
      max: Math.max(...evts.map((e) => e.span.end)) + 1,
    }
  }, [evts, year])

  if (evts.length === 0) return null

  const total = Math.max(1, max - min)
  const pos = (mi: number) => ((Math.min(Math.max(mi, min), max) - min) / total) * 100
  const cStart = (s: Evt['span']) => Math.max(s.start, min)
  const cEnd = (s: Evt['span']) => Math.min(s.end, max - 1)
  const dot = (s: Evt['span']) => pos(s.start) + (0.5 / total) * 100

  const shown = year !== null ? evts.filter((e) => e.span.end >= min && e.span.start < max) : evts
  const ranges = shown.filter((e) => e.span.isRange)
  const points = shown.filter((e) => !e.span.isRange)

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const mi = Math.round(min + (total * i) / 4)
    return {
      pct: (i / 4) * 100,
      label: `${Math.floor(mi / 12)}.${String((mi % 12) + 1).padStart(2, '0')}`,
    }
  })

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Awards &amp; Activity</h2>
        {years.length > 1 && (
          <div className="flex gap-1.5">
            {[null, ...years].map((y) => (
              <button
                key={y ?? 'all'}
                onClick={() => setYear(y)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  year === y
                    ? 'bg-accent text-bg'
                    : 'border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {y ?? '전체'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px] px-8">
          {/* 위쪽: 기간 활동 라벨 */}
          <div className="relative h-16">
            {ranges.map(({ it, span }) => {
              const isAward = it.type === 'award'
              const c = (pos(cStart(span)) + pos(cEnd(span) + 1)) / 2
              return (
                <div
                  key={it.id}
                  className="absolute bottom-0 w-[132px] -translate-x-1/2 text-center"
                  style={{ left: `${c}%` }}
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
              const l = pos(cStart(span))
              const w = pos(cEnd(span) + 1) - l
              return (
                <div
                  key={it.id}
                  className={`absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full ${
                    isAward ? 'bg-accent shadow-[0_0_10px_-1px_var(--color-accent)]' : 'bg-accent/75'
                  }`}
                  style={{ left: `${l}%`, width: `${w}%` }}
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
                  style={{ left: `${dot(span)}%` }}
                />
              )
            })}
          </div>

          {/* 아래쪽: 단발 이벤트 라벨 */}
          <div className="relative h-16">
            {points.map(({ it, span }) => {
              const isAward = it.type === 'award'
              return (
                <div
                  key={it.id}
                  className="absolute top-0 w-[132px] -translate-x-1/2 text-center"
                  style={{ left: `${dot(span)}%` }}
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

          {shown.length === 0 && (
            <p className="mt-6 text-center text-xs text-text-muted">해당 연도 항목이 없습니다.</p>
          )}

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
