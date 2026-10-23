'use client'

import { useEffect, useRef } from 'react'
import { useMediaQuery } from './useMediaQuery'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function confirmDiscard(dirty: boolean): boolean {
  return !dirty || confirm('저장하지 않은 수정이 있습니다. 닫을까요?')
}

interface Props {
  open: boolean
  /** 새로 열 때만 올린다 — 값이 바뀌면 첫 칸으로 포커스를 옮긴다(저장 뒤 다시 그릴 때는 올리지 않는다). */
  focusKey: number
  /** 패널 내용이 다시 그려질 때마다 올린다(저장·일괄 작업). 포커스가 body로 빠졌으면 패널로 되돌린다. */
  version?: number
  /** 스크린리더에 알릴 결과 문구(예: 저장했습니다.) */
  notice?: string
  title: string
  isDirty: () => boolean
  onClose: () => void
  children: React.ReactNode
}

// 넓은 화면(≥1280px)에선 표 옆에 붙는 칸이라 뒤 화면을 막지 않는다. 그보다 좁으면 표 위에 겹치는
// 대화상자(640px 미만은 아래 시트)라 Modal과 같은 규칙: 포커스 가두기, 스크롤 잠금, 닫으면 연 요소로 복귀.
export default function AdminSidePanel({ open, focusKey, version, notice, title, isDirty, onClose, children }: Props) {
  const docked = useMediaQuery('(min-width: 1280px)')
  const panel = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const closeRef = useRef(() => {})
  useEffect(() => {
    closeRef.current = () => {
      if (confirmDiscard(isDirty())) onClose()
    }
  }, [isDirty, onClose])

  // 열 때마다(패널이 열린 채 다른 줄을 눌러도) 누른 요소를 기억하고 첫 칸으로 포커스.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement as HTMLElement | null
    // 저장 직후엔 저장 버튼이 비활성으로 바뀌며 포커스가 body로 빠진 채 폼이 다시 그려진다 — body는 기억하지 않는다.
    if (active && active !== document.body && !panel.current?.contains(active)) opener.current = active
    panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
  }, [open, focusKey])

  // 저장하면 폼이 새 값으로 다시 그려져 눌렀던 버튼이 사라지고 포커스가 body로 빠진다 — 패널 안에 붙잡아 둔다.
  useEffect(() => {
    if (!open) return
    const active = document.activeElement
    if (!active || active === document.body) panel.current?.focus()
  }, [open, version])

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
      tabIndex={-1}
      className={
        'outline-none ' +
        (docked
          ? 'w-[400px] shrink-0 self-start sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto border border-border rounded-xl bg-bg-secondary'
          : 'fixed z-50 bg-bg-secondary border-border overflow-auto inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:max-h-none sm:rounded-none sm:border-l sm:border-t-0')
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
      <p role="status" className="sr-only">{notice}</p>
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
