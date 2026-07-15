'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { PortfolioItem } from '@/types'

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
type Evt = { it: PortfolioItem; span: NonNullable<ReturnType<typeof parseSpan>>; lane: number }

// 겹치지 않게 레인 배정(첫 이벤트 lane 0, 겹치면 다음 레인). 짝수 레인=위, 홀수 레인=아래.
function packLanes(evts: { it: PortfolioItem; span: { start: number; end: number } }[]): Evt[] {
  const laneEnd: number[] = []
  return evts.map((e) => {
    let lane = laneEnd.findIndex((end) => e.span.start > end)
    if (lane === -1) {
      lane = laneEnd.length
      laneEnd.push(e.span.end)
    } else {
      laneEnd[lane] = e.span.end
    }
    return { ...e, lane }
  })
}

// 활동 & 수상을 하나의 가로 타임라인으로 합침. 같은 시간에 겹치는 항목만 위/아래 레인으로
// 분리. 기간=막대 길이, 수상=★, 스크롤 시 막대 차오름 + 호버 설명.
export default function AwardsGantt({ items }: Props) {
  const base = useMemo(
    () =>
      items
        .map((it) => ({ it, span: parseSpan(it.year) }))
        .filter((r): r is { it: PortfolioItem; span: { start: number; end: number } } => r.span !== null)
        .sort((a, b) => a.span.start - b.span.start),
    [items]
  )

  const years = useMemo(() => {
    const set = new Set<number>()
    base.forEach((e) => {
      for (let y = Math.floor(e.span.start / 12); y <= Math.floor(e.span.end / 12); y++) set.add(y)
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [base])

  const [year, setYear] = useState<number | null>(null)

  const { min, max } = useMemo(() => {
    if (year !== null) return { min: monthIndex(year, 1), max: monthIndex(year + 1, 1) }
    return {
      min: Math.min(...base.map((e) => e.span.start)),
      max: Math.max(...base.map((e) => e.span.end)) + 1,
    }
  }, [base, year])

  if (base.length === 0) return null

  const total = Math.max(1, max - min)
  const pos = (mi: number) => ((Math.min(Math.max(mi, min), max) - min) / total) * 100
  const shownBase = year !== null ? base.filter((e) => e.span.end >= min && e.span.start < max) : base
  const events = packLanes(shownBase)

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const mi = Math.round(min + (total * i) / 4)
    return {
      pct: (i / 4) * 100,
      label: `${Math.floor(mi / 12)}.${String((mi % 12) + 1).padStart(2, '0')}`,
    }
  })

  const above = events.filter((e) => e.lane % 2 === 0)
  const below = events.filter((e) => e.lane % 2 === 1)

  const Label = ({ e, side }: { e: Evt; side: 'top' | 'bottom' }) => {
    const isAward = e.it.type === 'award'
    const months = e.span.end - e.span.start + 1
    const left = pos(Math.max(e.span.start, min))
    const width = pos(Math.min(e.span.end, max - 1) + 1) - left
    const c = left + width / 2
    return (
      <div
        className={`group absolute w-[128px] -translate-x-1/2 text-center ${side === 'top' ? 'bottom-0' : 'top-0'}`}
        style={{ left: `${c}%` }}
      >
        {side === 'bottom' && <div className="mx-auto h-3 w-px bg-accent/50" />}
        <div className={`line-clamp-2 text-[11.5px] font-medium leading-tight text-text-primary ${side === 'bottom' ? 'mt-1' : ''}`}>
          {isAward && <span className="text-accent">★ </span>}
          {e.it.title.trim()}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-accent">
          {e.it.year.trim()} · {months}개월
        </div>
        {side === 'top' && <div className="mx-auto mt-1 h-3 w-px bg-accent/50" />}
      </div>
    )
  }

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
        <div className="min-w-[640px] px-6">
          {/* 위쪽 라벨 */}
          <div className="relative h-16">
            {above.map((e) => (
              <Label key={e.it.id} e={e} side="top" />
            ))}
          </div>

          {/* 합쳐진 타임라인 밴드 (중앙선 + 막대) */}
          <motion.div
            key={String(year)}
            className="relative h-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            {events.map((e) => {
              const isAward = e.it.type === 'award'
              const isAbove = e.lane % 2 === 0
              const left = pos(Math.max(e.span.start, min))
              const width = pos(Math.min(e.span.end, max - 1) + 1) - left
              return (
                <motion.div
                  key={e.it.id}
                  className={`absolute h-2.5 origin-left rounded-full bg-accent ${
                    isAbove ? 'bottom-1/2 mb-[2px]' : 'top-1/2 mt-[2px]'
                  } ${isAward ? 'shadow-[0_0_10px_-2px_var(--color-accent)]' : ''}`}
                  style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                  variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
                  transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
                  title={e.it.description || `${e.it.year} · ${e.span.end - e.span.start + 1}개월`}
                />
              )
            })}
          </motion.div>

          {/* 아래쪽 라벨 */}
          <div className="relative h-16">
            {below.map((e) => (
              <Label key={e.it.id} e={e} side="bottom" />
            ))}
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

          {events.length === 0 && (
            <p className="mt-6 text-center text-xs text-text-muted">해당 연도 항목이 없습니다.</p>
          )}

          <p className="mt-5 text-[11px] text-text-muted">
            막대 길이 = 활동 기간 · <span className="text-accent">★</span> = 수상 · 겹치는 기간은 위/아래로 나뉩니다
          </p>
        </div>
      </div>
    </section>
  )
}
