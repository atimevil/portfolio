'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export default function LangToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function toggle() {
    const next = locale === 'ko' ? 'en' : 'ko'
    const newPath = pathname.replace(`/${locale}`, `/${next}`)
    window.location.href = newPath
  }

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors border border-border"
    >
      {locale === 'ko' ? 'EN' : '한'}
    </button>
  )
}
