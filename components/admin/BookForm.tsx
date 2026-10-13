'use client'

import { useEffect, useState } from 'react'
import type { Book } from '@prisma/client'
import GenreInput from './GenreInput'

export const STATUS_LABEL = { reading: '읽는 중', done: '다 읽음', want: '읽고 싶음' } as const
export type Status = keyof typeof STATUS_LABEL

type FormState = { title: string; author: string; genre: string; status: Status; rating: number; memo: string }

function toForm(b: Book | null): FormState {
  return {
    title: b?.title ?? '',
    author: b?.author ?? '',
    genre: b?.genre ?? '',
    status: (b?.status as Status) ?? 'want',
    rating: b?.rating ?? 0,
    memo: b?.memo ?? '',
  }
}

interface Props {
  item: Book | null
  genres: string[]
  onSaved: (b: Book) => void
  onDirtyChange: (dirty: boolean) => void
}

// 패널 안 책 추가/수정 폼. 부모가 key를 바꿔 다시 마운트하면 새 항목 값으로 초기화된다.
export default function BookForm({ item, genres, onSaved, onDirtyChange }: Props) {
  const [initial] = useState(() => toForm(item))
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) {
      setError('제목과 저자는 꼭 채워 주세요.')
      return
    }
    setBusy(true)
    setError(null)
    const payload = {
      title: form.title,
      author: form.author,
      genre: form.genre,
      status: form.status,
      rating: form.status === 'done' && form.rating > 0 ? form.rating : null,
      memo: form.memo,
    }
    // 수정은 바뀐 칸만 보낸다(다른 곳에서 바뀐 값을 옛 값으로 덮지 않게). 상태와 별점은 서로 묶여 있어 함께 보낸다.
    const changed: Partial<typeof payload> = {}
    if (item) {
      for (const k of ['title', 'author', 'genre', 'memo'] as const) if (form[k] !== initial[k]) changed[k] = payload[k]
      if (form.status !== initial.status || form.rating !== initial.rating) {
        changed.status = payload.status
        changed.rating = payload.rating
      }
    }
    // 네트워크 오류로 fetch가 reject되면 busy가 안 풀려 저장 버튼이 영구히 잠긴다 — finally로 항상 해제.
    try {
      const res = await fetch('/api/books', {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item ? { id: item.id, ...changed } : payload),
      })
      if (!res.ok) {
        setError(res.status === 401 ? '저장 실패: 로그인이 만료됐습니다. 다른 탭에서 다시 로그인한 뒤 저장해 주세요 (입력한 내용은 그대로 둡니다).' : res.status === 400 ? '저장 실패: 입력값을 확인해 주세요.' : `저장에 실패했습니다 (오류 ${res.status}).`)
        return
      }
      onSaved(await res.json())
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const label = 'block text-xs text-text-secondary mb-1'
  const input = 'w-full border border-border rounded-md px-3 py-2 text-sm bg-bg'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={label} htmlFor="book-title">제목</label>
        <input id="book-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="book-author">저자</label>
        <input id="book-author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="book-genre">장르</label>
        <GenreInput id="book-genre" value={form.genre} onChange={(genre) => setForm({ ...form, genre })} genres={genres} />
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className={label} htmlFor="book-status">상태</label>
          <select
            id="book-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-bg"
          >
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <fieldset disabled={form.status !== 'done'} className="disabled:opacity-40">
          <legend className={label}>별점 (다 읽음일 때)</legend>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setForm({ ...form, rating: form.rating === n ? 0 : n })}
                className={`w-8 h-8 ${n <= form.rating ? 'text-accent' : 'text-text-muted'}`}
                aria-label={`${n}점`}
                aria-pressed={n <= form.rating}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div>
        <label className={label} htmlFor="book-memo">한줄 메모</label>
        <input id="book-memo" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} className={input} />
      </div>

      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={busy || (!!item && !dirty)}
        className="w-full px-3 py-2 bg-text-primary text-bg text-sm rounded-md disabled:opacity-50"
      >
        {busy ? '저장 중…' : item ? '수정 저장' : '추가'}
      </button>
    </form>
  )
}
