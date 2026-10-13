'use client'

import { useEffect, useState } from 'react'
import type { Track } from '@prisma/client'
import { uploadMusicCover } from '@/lib/uploadMusicCover'
import GenreInput from './GenreInput'

// 자동으로 채운 커버인지 판별하는 접두사 — 직접 업로드한 /uploads/... 경로와 구분한다.
const YOUTUBE_THUMB_PREFIX = 'https://img.youtube.com/vi/'

type FormState = { title: string; artist: string; genre: string; cover: string; link: string; memo: string; favorite: boolean }

function toForm(t: Track | null): FormState {
  return {
    title: t?.title ?? '',
    artist: t?.artist ?? '',
    genre: t?.genre ?? '',
    cover: t?.cover ?? '',
    link: t?.link ?? '',
    memo: t?.memo ?? '',
    favorite: t?.favorite ?? false,
  }
}

// youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, /embed/ 형태에서 영상 ID를 뽑는다.
function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// 영상 제목이 보통 "아티스트 - 곡명" 형태라 그걸 분리하고, 없으면 채널명을 아티스트로 대신 쓴다.
function parseYoutubeTitle(rawTitle: string, channelName: string): { title: string; artist: string } {
  const cleaned = rawTitle
    .replace(/[([（【][^)\]）】]*(official|m\/?v|mv|audio|lyrics?|video|hd|4k)[^)\]）】]*[)\]）】]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const match = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/)
  if (match) return { artist: match[1].trim(), title: match[2].trim() }
  return { title: cleaned, artist: channelName }
}

function changedFields<T extends object>(form: T, initial: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(form).filter(([k, v]) => v !== (initial as Record<string, unknown>)[k])
  ) as Partial<T>
}

interface Props {
  item: Track | null
  genres: string[]
  onSaved: (t: Track) => void
  onDirtyChange: (dirty: boolean) => void
}

// 패널 안 곡 추가/수정 폼. 부모가 key를 바꿔 다시 마운트하면 새 항목 값으로 초기화된다.
export default function TrackForm({ item, genres, onSaved, onDirtyChange }: Props) {
  const [initial] = useState(() => toForm(item))
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  async function handleLinkBlur() {
    const videoId = extractYoutubeId(form.link)
    if (!videoId || (form.title.trim() && form.artist.trim())) return
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(form.link)}&format=json`)
      if (!res.ok) return
      const data = await res.json()
      const parsed = parseYoutubeTitle(data.title, data.author_name)
      setForm((f) => ({
        ...f,
        title: f.title.trim() ? f.title : parsed.title,
        artist: f.artist.trim() ? f.artist : parsed.artist,
      }))
    } catch {
      // 조회 실패해도 조용히 무시 — 어차피 직접 입력하면 됨
    }
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
    if (!form.title.trim() || !form.artist.trim()) {
      setError('제목과 아티스트는 꼭 채워 주세요.')
      return
    }
    setBusy(true)
    setError(null)
    // 네트워크 오류로 fetch가 reject되면 busy가 안 풀려 저장 버튼이 영구히 잠긴다 — finally로 항상 해제.
    try {
      const res = await fetch('/api/music', {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 수정은 바뀐 칸만 보낸다 — 패널을 연 뒤 표에서 ★를 토글했거나 다른 탭에서 고친 값을 옛 값으로 덮지 않게.
        body: JSON.stringify(item ? { id: item.id, ...changedFields(form, initial) } : form),
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
        <label className={label} htmlFor="track-title">곡 제목</label>
        <input id="track-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="track-artist">아티스트</label>
        <input id="track-artist" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="track-genre">장르</label>
        <GenreInput id="track-genre" value={form.genre} onChange={(genre) => setForm({ ...form, genre })} genres={genres} />
      </div>
      <div>
        <label className={label} htmlFor="track-link">재생 링크</label>
        <input
          id="track-link"
          value={form.link}
          onChange={(e) => {
            const link = e.target.value
            const videoId = extractYoutubeId(link)
            // 커버가 비어있거나, 이전에 자동으로 채운 유튜브 썸네일일 때만 갱신한다.
            // (직접 올린 이미지는 덮어쓰지 않고, 링크를 고쳐도 옛 영상 썸네일이 남지 않게)
            const autoFilled = form.cover.startsWith(YOUTUBE_THUMB_PREFIX)
            const cover =
              videoId && (!form.cover || autoFilled) ? `${YOUTUBE_THUMB_PREFIX}${videoId}/hqdefault.jpg` : form.cover
            setForm({ ...form, link, cover })
          }}
          onBlur={handleLinkBlur}
          placeholder="Spotify/YouTube 등 — 유튜브 링크면 제목·아티스트·썸네일 자동 채움"
          className={input}
        />
      </div>
      <div>
        <label className={label} htmlFor="track-memo">메모</label>
        <textarea
          id="track-memo"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="목록에서 곡에 마우스를 올리면 보임"
          rows={3}
          className={`${input} resize-none`}
        />
      </div>
      <div className="flex items-center gap-3">
        {form.cover && <img src={form.cover} alt="" className="w-12 h-12 rounded object-cover" />}
        <label className="text-sm text-text-secondary">
          커버 이미지 <input type="file" accept="image/*" onChange={handleCoverChange} className="block text-xs mt-1" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" checked={form.favorite} onChange={(e) => setForm({ ...form, favorite: e.target.checked })} />
        즐겨찾기
      </label>

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
