'use client'

import { useState } from 'react'

interface TimelineItemProps {
  year: string
  type: '활동' | '수상'
  title: string
  description?: string
}

export default function TimelineItem({ year, type, title, description }: TimelineItemProps) {
  const [open, setOpen] = useState(false)
  const hasDesc = !!description

  return (
    <div className="relative mb-5 last:mb-0">
      <div className="absolute -left-5 top-[5px] w-[9px] h-[9px] rounded-full bg-bg border-2 border-border" />
      <button
        className={`w-full text-left group ${hasDesc ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => hasDesc && setOpen((v) => !v)}
        aria-expanded={hasDesc ? open : undefined}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-text-muted tabular-nums">{year}</span>
          <span className="text-[9px] text-text-muted border border-border rounded px-1 py-px leading-none">
            {type}
          </span>
          {hasDesc && (
            <span className={`ml-auto text-[9px] text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              ▾
            </span>
          )}
        </div>
        <p className={`text-xs leading-snug transition-colors ${hasDesc ? 'group-hover:text-text-secondary' : ''} text-text-primary`}>
          {title}
        </p>
      </button>

      {hasDesc && open && (
        <p className="text-[10px] text-text-muted mt-1.5 leading-snug border-l border-border pl-2">
          {description}
        </p>
      )}
    </div>
  )
}
