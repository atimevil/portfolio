'use client'

import { useState } from 'react'
import GenreInput from './GenreInput'

// 일괄 장르 바꾸기: 작은 펼침 상자 안에서 장르를 고르거나 입력하고 적용.
export default function BulkGenre({ genres, onApply }: { genres: string[]; onApply: (genre: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer px-2.5 py-1.5 rounded-md border border-border">장르 바꾸기 ▾</summary>
      <div className="absolute bottom-full mb-2 left-0 w-72 p-3 rounded-lg border border-border bg-bg-secondary shadow-lg space-y-2">
        <GenreInput value={value} onChange={setValue} genres={genres} />
        <button
          type="button"
          onClick={(e) => {
            // 비운 채 누르면 고른 항목의 장르를 전부 지운다. 되돌릴 수 없어 삭제처럼 한 번 묻는다.
            if (!value.trim() && !confirm('고른 항목의 장르를 지웁니다(장르 없음). 되돌릴 수 없습니다. 계속할까요?')) return
            onApply(value)
            setValue('')
            ;(e.currentTarget.closest('details') as HTMLDetailsElement).open = false
          }}
          className="w-full px-3 py-1.5 bg-text-primary text-bg text-sm rounded-md"
        >
          {value.trim() ? `‘${value.trim()}’ 적용` : '장르 없음으로 되돌리기'}
        </button>
      </div>
    </details>
  )
}
