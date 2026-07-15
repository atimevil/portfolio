'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface TimelineItemProps {
  year: string
  type: '활동' | '수상' | '프로젝트'
  title: string
  description?: string
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

export default function TimelineItem({ year, type, title, description }: TimelineItemProps) {
  const [open, setOpen] = useState(false)
  const hasDesc = !!description

  return (
    <div className="relative mb-5 last:mb-0">
      {/* 클릭 가능 여부에 따라 dot 색상 구분 */}
      <div className={`absolute -left-5 top-[5px] w-[9px] h-[9px] rounded-full border-2 ${
        hasDesc ? 'bg-accent border-accent' : 'bg-bg border-border'
      }`} />

      <button
        className={`w-full text-left ${hasDesc ? 'cursor-pointer group' : 'cursor-default'}`}
        onClick={() => hasDesc && setOpen(true)}
        disabled={!hasDesc}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-text-muted tabular-nums">{year}</span>
          <span className="text-[9px] text-text-muted border border-border rounded px-1 py-px leading-none">
            {type}
          </span>
          {hasDesc && (
            <span className="text-[9px] text-text-muted ml-auto opacity-50 group-hover:opacity-100 transition-opacity">
              +
            </span>
          )}
        </div>
        <p className={`text-xs leading-snug text-text-primary ${
          hasDesc ? 'group-hover:underline underline-offset-2' : ''
        }`}>
          {title}
        </p>
      </button>

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
