'use client'

import { useState } from 'react'
import type { Track } from '@prisma/client'
import { uploadMusicCover } from '@/lib/uploadMusicCover'

const GENRE_PRESETS = ['락', '힙합', '재즈', '팝', '알앤비', '인디']

type FormState = {
  id: number | null
  title: string
  artist: string
  genre: string
  cover: string
  link: string
}

const EMPTY_FORM: FormState = { id: null, title: '', artist: '', genre: '', cover: '', link: '' }

interface Props {
  initialTracks: Track[]
}

export default function AdminMusicManager({ initialTracks }: Props) {
  const [tracks, setTracks] = useState(initialTracks)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(track: Track) {
    setForm({
      id: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre ?? '',
      cover: track.cover ?? '',
      link: track.link ?? '',
    })
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadMusicCover(file)
      setForm((f) => ({ ...f, cover: url }))
    } catch {
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.artist.trim()) return
    setBusy(true)
    setError(null)

    const payload = {
      title: form.title,
      artist: form.artist,
      genre: form.genre,
      cover: form.cover,
      link: form.link,
    }

    const res = await fetch('/api/music', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
    })

    setBusy(false)
    if (!res.ok) {
      setError('저장에 실패했습니다.')
      return
    }
    const saved: Track = await res.json()
    setTracks((prev) => (form.id ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]))
    setForm(EMPTY_FORM)
  }

  async function handleDelete(id: number) {
    if (!confirm('이 트랙을 삭제하시겠습니까?')) return
    const res = await fetch('/api/music', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setTracks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-bg-secondary">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="곡 제목"
            className="border border-border rounded-md px-3 py-2 text-sm bg-bg"
          />
          <input
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            placeholder="아티스트"
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

        <input
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="재생 링크 (Spotify/YouTube 등)"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg"
        />

        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleCoverChange} className="text-sm" />
          {form.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover} alt="" className="w-10 h-10 rounded object-cover" />
          )}
        </div>

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
        {tracks.length === 0 && <p className="text-center text-text-secondary py-10 text-sm">트랙이 없습니다.</p>}
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary text-sm truncate">{track.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{track.artist}</p>
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
              <button onClick={() => startEdit(track)} className="text-xs text-text-secondary hover:text-text-primary">
                수정
              </button>
              <button onClick={() => handleDelete(track.id)} className="text-xs text-text-secondary hover:text-red-500">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
