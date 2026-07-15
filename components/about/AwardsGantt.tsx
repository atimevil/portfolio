'use client'

import { useMemo, useState } from 'react'
import type { PortfolioItem } from '@/types'

// "2025.03~09" / "2025.10~11" / "2026.01~02" / "2025.04" 를 월 인덱스 구간으로.
function monthIndex(y: number, m: number) {
  return y * 12 + (m - 1)
}
function parseSpan(raw: string): { start: number; end: number } | null {
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
  return { start, end }
}

interface Props {
  items: PortfolioItem[]
}
type Evt = { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>> }

// 활동 & 수상 간트: 항목마다 한 줄(레인). 모든 줄이 같은 시간축을 공유하므로
// 막대 위치=시점, 막대 길이=기간(개월)이 정확히 비례한다. 수상은 ★.
export default function AwardsGantt({ items }: Props) {
  const evts = useMemo<Evt[]>(
    () =>
      items
        .map((it) => ({ it, span: parseSpan(it.year) }))
        .filter((r): r is Evt => r.span !== null)
        .sort((a, b) => a.span.start - b.span.start),
    [items]
  )

  const years = useMemo(() => {
    const set = new Set<number>()
    evts.forEach((e) => {
      for (let y = Math.floor(e.span.start / 12); y <= Math.floor(e.span.end / 12); y++) set.add(y)
    })
    return Array.from(set).sort((a, b) => a - b)
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
  const shown = year !== null ? evts.filter((e) => e.span.end >= min && e.span.start < max) : evts

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
        <div className="min-w-[560px]">
          <div className="flex flex-col gap-4">
            {shown.map(({ it, span }) => {
              const isAward = it.type === 'award'
              const months = span.end - span.start + 1
              const left = pos(Math.max(span.start, min))
              const width = pos(Math.min(span.end, max - 1) + 1) - left
              return (
                <div key={it.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm leading-snug text-text-primary">
                      {isAward && <span className="text-accent">★ </span>}
                      {it.title.trim()}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-accent">
                      {it.year.trim()} · {months}개월
                    </span>
                  </div>
                  <div className="relative h-3">
                    <div className="absolute inset-0 rounded-full bg-surface" />
                    <div
                      className="absolute inset-y-0 rounded-full bg-accent"
                      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 시간축 눈금 */}
          <div className="relative mt-3 h-4 border-t border-border">
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

          <p className="mt-5 text-[11px] text-text-muted">
            막대 길이 = 활동 기간 · <span className="text-accent">★</span> = 수상
          </p>
        </div>
      </div>
    </section>
  )
}
