'use client'

import { useState } from 'react'
import type { Book } from '@prisma/client'

const GENRE_PRESETS = ['소설', '자기계발', '에세이', '인문', '과학']
const STATUS_LABEL = { reading: '읽는 중', done: '다 읽음', want: '읽고 싶음' } as const

type FormState = {
  id: number | null
  title: string
  author: string
  genre: string
  status: 'reading' | 'done' | 'want'
  rating: number
  memo: string
}

const EMPTY_FORM: FormState = { id: null, title: '', author: '', genre: '', status: 'want', rating: 0, memo: '' }

interface Props {
  initialBooks: Book[]
}

export default function AdminBookManager({ initialBooks }: Props) {
  const [books, setBooks] = useState(initialBooks)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(book: Book) {
    setForm({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre ?? '',
      status: book.status as FormState['status'],
      rating: book.rating ?? 0,
      memo: book.memo ?? '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) return
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

    const res = await fetch('/api/books', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
    })

    setBusy(false)
    if (!res.ok) {
      setError('저장에 실패했습니다.')
      return
    }
    const saved: Book = await res.json()
    setBooks((prev) => (form.id ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev]))
    setForm(EMPTY_FORM)
  }

  async function handleDelete(id: number) {
    if (!confirm('이 책을 삭제하시겠습니까?')) return
    const res = await fetch('/api/books', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-bg-secondary">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목"
            className="border border-border rounded-md px-3 py-2 text-sm bg-bg"
          />
          <input
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="저자"
            className="border border-border rounded-md px-3 py-2 text-sm bg-bg"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GENRE_PRESETS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setForm({ ...form, genre: g })}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                form.genre === g
                  ? 'border-accent text-accent'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {g}
            </button>
          ))}
          <input
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            placeholder="직접 입력"
            className="text-xs border border-border rounded-full px-2 py-1 bg-bg w-24"
          />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-bg"
          >
            {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          {form.status === 'done' && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setForm({ ...form, rating: n })}
                  className={n <= form.rating ? 'text-accent' : 'text-text-muted'}
                  aria-label={`${n}점`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="한줄 메모"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 bg-text-primary text-bg text-sm rounded-md disabled:opacity-50"
          >
            {form.id ? '수정 저장' : '추가'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-sm text-text-secondary">
              취소
            </button>
          )}
        </div>
      </form>

      <div className="border border-border rounded-xl divide-y divide-border">
        {books.length === 0 && <p className="text-center text-text-secondary py-10 text-sm">책이 없습니다.</p>}
        {books.map((book) => (
          <div key={book.id} className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary text-sm truncate">{book.title}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {book.author} · {STATUS_LABEL[book.status as keyof typeof STATUS_LABEL]}
              </p>
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
              <button onClick={() => startEdit(book)} className="text-xs text-text-secondary hover:text-text-primary">
                수정
              </button>
              <button onClick={() => handleDelete(book.id)} className="text-xs text-text-secondary hover:text-red-500">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
