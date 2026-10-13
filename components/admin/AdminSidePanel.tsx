'use client'

import { useEffect, useRef } from 'react'
import { useMediaQuery } from './useMediaQuery'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function confirmDiscard(dirty: boolean): boolean {
  return !dirty || confirm('저장하지 않은 수정이 있습니다. 닫을까요?')
}

interface Props {
  open: boolean
  focusKey: number
  title: string
  dirty: boolean
  onClose: () => void
  children: React.ReactNode
}

// 넓은 화면(≥1280px)에선 표 옆에 붙는 칸이라 뒤 화면을 막지 않는다. 그보다 좁으면 표 위에 겹치는
// 대화상자(640px 미만은 아래 시트)라 Modal과 같은 규칙: 포커스 가두기, 스크롤 잠금, 닫으면 연 요소로 복귀.
export default function AdminSidePanel({ open, focusKey, title, dirty, onClose, children }: Props) {
  const docked = useMediaQuery('(min-width: 1280px)')
  const panel = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const closeRef = useRef(() => {})
  useEffect(() => {
    closeRef.current = () => {
      if (confirmDiscard(dirty)) onClose()
    }
  }, [dirty, onClose])

  // 열 때마다(패널이 열린 채 다른 줄을 눌러도) 누른 요소를 기억하고 첫 칸으로 포커스.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement as HTMLElement | null
    if (active && !panel.current?.contains(active)) opener.current = active
    panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
  }, [open, focusKey])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    if (!docked) document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (docked || e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === firstEl || !panel.current.contains(active))) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && (active === lastEl || !panel.current.contains(active))) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [open, docked])

  // 닫히면 마지막으로 누른 줄로 포커스를 돌려준다(삭제돼 사라졌으면 생략).
  useEffect(() => {
    if (open) return
    const el = opener.current
    opener.current = null
    if (el?.isConnected) el.focus()
  }, [open])

  if (!open) return null

  const body = (
    <section
      ref={panel}
      role="dialog"
      aria-modal={docked ? undefined : true}
      aria-label={title}
      className={
        docked
          ? 'w-[400px] shrink-0 self-start sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto border border-border rounded-xl bg-bg-secondary'
          : 'fixed z-50 bg-bg-secondary border-border overflow-auto inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:max-h-none sm:rounded-none sm:border-l sm:border-t-0'
      }
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-border sticky top-0 bg-bg-secondary z-10">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <button
          type="button"
          onClick={() => closeRef.current()}
          aria-label="닫기"
          className="w-9 h-9 -mr-2 rounded-md text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )

  if (docked) return body
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => closeRef.current()} aria-hidden="true" />
      {body}
    </>
  )
}
