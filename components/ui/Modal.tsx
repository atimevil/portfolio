'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  label?: string
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

// 대화상자 동작: 열리면 포커스를 안으로 옮기고, Tab은 안에서만 돌고, 닫히면 연 요소로 돌려준다.
// 열려 있는 동안 뒤 페이지는 스크롤되지 않는다. 예전엔 Esc만 지원해서 키보드 사용자가 Tab으로
// 모달 뒤의 링크로 빠져나갔고, 모바일에선 모달을 넘기다 뒤 페이지가 같이 스크롤됐다.
export default function Modal({ open, onClose, children, label }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // 닫히는 애니메이션 동안에도 화면 전체를 덮고 있어서 그 사이 클릭이 먹혔다. 닫는 순간 클릭을 통과시킨다.
          exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.15 } }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="relative z-10 w-full max-w-5xl overflow-hidden rounded-xl bg-bg shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <button
              onClick={onClose}
              type="button"
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="닫기"
            >
              ✕
            </button>
            {/* 스크롤은 안쪽에서만 — 긴 포스터를 내려 읽어도 닫기 버튼이 같이 올라가 사라지지 않는다 */}
            <div data-modal-scroll className="max-h-[90vh] overflow-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
