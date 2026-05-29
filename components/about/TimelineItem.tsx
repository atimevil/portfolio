'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface TimelineItemProps {
  year: string
  type: '활동' | '수상'
  title: string
  description?: string
}

function Popup({ year, type, title, description, onClose }: TimelineItemProps & { onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full max-w-sm bg-bg border border-border rounded-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-text-muted tabular-nums">{year}</span>
          <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-px">
            {type}
          </span>
        </div>
        <p className="text-sm font-semibold text-text-primary mb-3">{title}</p>
        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors text-xs p-1"
          aria-label="닫기"
        >
          ✕
        </button>
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
      <div className="absolute -left-5 top-[5px] w-[9px] h-[9px] rounded-full bg-bg border-2 border-border" />
      <button
        className={`w-full text-left ${hasDesc ? 'cursor-pointer group' : 'cursor-default'}`}
        onClick={() => hasDesc && setOpen(true)}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-text-muted tabular-nums">{year}</span>
          <span className="text-[9px] text-text-muted border border-border rounded px-1 py-px leading-none">
            {type}
          </span>
        </div>
        <p className={`text-xs leading-snug text-text-primary ${hasDesc ? 'group-hover:underline' : ''}`}>
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
