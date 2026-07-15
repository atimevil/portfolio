'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface TimelineItemProps {
  year: string
  type: '활동' | '수상' | '프로젝트'
  title: string
  description?: string
  /** 기간 막대: pct=최장 대비 비율(0~100), months=개월 수. 단발 이벤트면 생략 */
  bar?: { pct: number; months: number }
}

function Popup({ year, type, title, description, onClose }: TimelineItemProps & { onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-lg bg-bg border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted tabular-nums">{year}</span>
            <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-px">
              {type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-sm shrink-0"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-base font-semibold text-text-primary mb-4">{title}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function TimelineItem({ year, type, title, description, bar }: TimelineItemProps) {
  const [open, setOpen] = useState(false)
  const hasDesc = !!description
  const isAward = type === '수상'

  return (
    <div className="relative mb-5 last:mb-0">
      {/* 세로선 위의 점 — 수상은 채운 accent + 링 글로우, 그 외는 빈 원 */}
      <div
        className={`absolute -left-[25px] top-[3px] w-3 h-3 rounded-full border-2 ${
          isAward
            ? 'bg-accent border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
            : 'bg-bg border-accent'
        }`}
      />

      <button
        className={`w-full text-left ${hasDesc ? 'cursor-pointer group' : 'cursor-default'}`}
        onClick={() => hasDesc && setOpen(true)}
        disabled={!hasDesc}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-accent">{year}</span>
          {isAward && <span className="text-[10px] font-bold text-accent">★ 수상</span>}
          {hasDesc && (
            <span className="ml-auto text-[10px] text-text-muted opacity-50 group-hover:opacity-100 transition-opacity">
              +
            </span>
          )}
        </div>
        <p
          className={`mt-0.5 text-[13px] leading-snug text-text-primary ${
            hasDesc ? 'group-hover:text-accent-hover transition-colors' : ''
          }`}
        >
          {title}
        </p>
      </button>

      {/* 기간 막대 — 최장 활동 대비 길이로 '얼마나 오래' 했는지 시각화 */}
      {bar && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent" style={{ width: `${bar.pct}%` }} />
          </div>
          <span className="mt-1 block font-mono text-[10px] text-text-muted">{bar.months}개월</span>
        </div>
      )}

      {open && (
        <Popup
          year={year}
          type={type}
          title={title}
          description={description}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
