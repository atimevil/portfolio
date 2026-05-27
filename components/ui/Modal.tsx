'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 max-w-4xl max-h-[90vh] overflow-auto rounded-xl bg-bg shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface text-text-secondary hover:text-text-primary transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
