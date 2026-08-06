'use client'

import { useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (url: string) => void
}

// 사진 한 장 업로드 — 기존 /api/upload를 재사용하고 type=maps로 폴더만 나눈다.
export default function PhotoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('type', 'maps')
      const res = await fetch('/api/upload', { method: 'POST', body })
      if (!res.ok) {
        setError('업로드에 실패했습니다.')
        return
      }
      const { url } = await res.json()
      onChange(url)
    } catch {
      setError('업로드에 실패했습니다.')
    } finally {
      setBusy(false)
      // 같은 파일을 다시 골라도 change 이벤트가 나도록 초기화
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="" className="h-16 w-16 rounded-md object-cover" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
            >
              변경
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-red-500"
            >
              제거
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy ? '업로드 중…' : '+ 사진 추가'}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
