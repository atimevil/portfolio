'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Track } from '@prisma/client'
import AdminTable, { type Column, type FilterGroup } from './AdminTable'
import AdminSidePanel, { confirmDiscard } from './AdminSidePanel'
import GenreInput from './GenreInput'
import TrackForm from './TrackForm'
import { sendBulk } from '@/lib/adminFetch'
import { dateValue, genreCounts, parseListState, type RawParams } from '@/lib/adminList'

const DEFAULT_SORT = 'createdAt'
const SORT_KEYS = ['title', 'artist', 'genre', 'favorite', 'createdAt']
const GROUPS = ['flag', 'genre']

const searchFields = (t: Track) => [t.title, t.artist, t.memo]

interface Props {
  initialTracks: Track[]
  initialQuery: RawParams
}

export default function AdminMusicManager({ initialTracks, initialQuery }: Props) {
  const router = useRouter()
  const [tracks, setTracks] = useState(initialTracks)
  // router.refresh()로 서버 목록이 새로 오면 그걸로 바꾼다(렌더 중 이전 값 비교 — NavBar와 같은 패턴).
  const [prevInitial, setPrevInitial] = useState(initialTracks)
  if (prevInitial !== initialTracks) {
    setPrevInitial(initialTracks)
    setTracks(initialTracks)
  }

  const [initialState] = useState(() => parseListState(initialQuery, GROUPS, SORT_KEYS, DEFAULT_SORT))
  const [panel, setPanel] = useState<{ open: boolean; item: Track | null; version: number }>({ open: false, item: null, version: 0 })
  const [dirty, setDirty] = useState(false)
  const [flashId, setFlashId] = useState<number | null>(null)

  const genres = useMemo(() => genreCounts(tracks).map((g) => g.genre), [tracks])

  // ★ 한 번 누르기는 지금처럼 먼저 바꾸고 실패하면 되돌린다(일괄 작업과 달리 즉시 반응이 중요).
  const toggleFavorite = useCallback(async (track: Track) => {
    const favorite = !track.favorite
    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, favorite } : t)))
    try {
      const res = await fetch('/api/music', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: track.id, favorite }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch (err) {
      setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, favorite: track.favorite } : t)))
      alert((err as Error).message === '401' ? '즐겨찾기 변경 실패: 로그인이 만료됐습니다. 다시 로그인해 주세요.' : '즐겨찾기 변경에 실패했습니다.')
    }
  }, [])

  const columns = useMemo<Column<Track>[]>(
    () => [
      {
        key: 'cover',
        label: '커버',
        className: 'w-14',
        render: (t) =>
          t.cover ? (
            <img src={t.cover} alt="" loading="lazy" className="w-10 h-10 rounded object-cover" />
          ) : (
            <span className="block w-10 h-10 rounded bg-surface" />
          ),
      },
      { key: 'title', label: '제목', sortValue: (t) => t.title, render: (t) => t.title },
      { key: 'artist', label: '아티스트', sortValue: (t) => t.artist, render: (t) => <span className="text-text-secondary">{t.artist}</span> },
      { key: 'genre', label: '장르', sortValue: (t) => t.genre, render: (t) => t.genre ?? <span className="text-text-muted">—</span> },
      {
        key: 'favorite',
        label: '★',
        className: 'w-10',
        sortValue: (t) => (t.favorite ? 1 : 0),
        render: (t) => (
          <button
            type="button"
            onClick={() => toggleFavorite(t)}
            aria-pressed={t.favorite}
            aria-label={t.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
            className={`w-8 h-8 text-lg leading-none ${t.favorite ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
          >
            {t.favorite ? '★' : '☆'}
          </button>
        ),
      },
      {
        key: 'createdAt',
        label: '추가한 날',
        className: 'w-24 text-text-muted',
        sortValue: (t) => dateValue(t.createdAt),
        render: (t) => new Date(t.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' }),
      },
    ],
    [toggleFavorite]
  )

  const filterGroups = useMemo<FilterGroup<Track>[]>(
    () => [
      {
        group: 'flag',
        filters: [
          { group: 'flag', id: 'favorite', label: '즐겨찾기', test: (t) => t.favorite },
          { group: 'flag', id: 'nogenre', label: '장르 없음', test: (t) => !t.genre },
          { group: 'flag', id: 'nocover', label: '커버 없음', test: (t) => !t.cover },
        ],
      },
      {
        group: 'genre',
        label: '장르:',
        filters: genres.map((g) => ({ group: 'genre', id: g, label: g, test: (t: Track) => t.genre === g })),
      },
    ],
    [genres]
  )

  function openPanel(item: Track | null) {
    if (panel.open && !confirmDiscard(dirty)) return
    setDirty(false)
    setPanel((p) => ({ open: true, item, version: p.version + 1 }))
  }

  const closePanel = useCallback(() => {
    setDirty(false)
    setPanel((p) => ({ ...p, open: false, item: null }))
  }, [])

  function handleSaved(saved: Track) {
    setTracks((prev) => (prev.some((t) => t.id === saved.id) ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]))
    setDirty(false)
    setPanel((p) => ({ open: true, item: saved, version: p.version + 1 }))
    setFlashId(saved.id)
    setTimeout(() => setFlashId((id) => (id === saved.id ? null : id)), 1500)
  }

  // 열린 패널의 곡이 일괄 대상이면: 저장 안 한 수정이 있으면 먼저 묻고, 끝나면 패널을 새 값으로 다시 채운다.
  function guardOpenItem(ids: number[]): boolean {
    if (!panel.item || !ids.includes(panel.item.id) || !dirty) return true
    return confirm('패널에서 고치던 내용은 사라집니다. 계속할까요?')
  }

  // 응답을 기다리는 동안 ★ 토글·패널 저장·다른 줄 열기가 끼어들 수 있다 — 클릭 당시 값이 아니라
  // 함수형 갱신으로 그때의 최신 목록·패널에 적용한다.
  async function runBulk(ids: number[], clear: () => void, body: object, apply: (prev: Track[]) => Track[], isDelete = false) {
    if (!guardOpenItem(ids)) return
    try {
      const count = await sendBulk('/api/music', isDelete ? 'DELETE' : 'PATCH', { ids, ...body })
      setTracks((prev) => apply(prev))
      clear()
      setPanel((p) => {
        if (!p.item || !ids.includes(p.item.id)) return p
        if (isDelete) return { open: false, item: null, version: p.version + 1 }
        return { ...p, item: apply([p.item])[0] ?? null, version: p.version + 1 }
      })
      if (panel.item && ids.includes(panel.item.id)) setDirty(false)
      if (count !== ids.length) router.refresh()
    } catch (err) {
      alert(`일괄 작업 실패: ${(err as Error).message}`)
    }
  }

  function bulkActions(ids: number[], clear: () => void) {
    return (
      <>
        <BulkGenre
          genres={genres}
          onApply={(genre) =>
            runBulk(ids, clear, { set: { genre } }, (prev) => {
              const canonical = genres.find((g) => g.toLowerCase() === genre.trim().toLowerCase()) ?? (genre.trim() || null)
              return prev.map((t) => (ids.includes(t.id) ? { ...t, genre: canonical } : t))
            })
          }
        />
        <button type="button" className="px-2.5 py-1.5 rounded-md border border-border" onClick={() => runBulk(ids, clear, { set: { favorite: true } }, (prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, favorite: true } : t)))}>
          즐겨찾기 켜기
        </button>
        <button type="button" className="px-2.5 py-1.5 rounded-md border border-border" onClick={() => runBulk(ids, clear, { set: { favorite: false } }, (prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, favorite: false } : t)))}>
          즐겨찾기 끄기
        </button>
        <button
          type="button"
          className="px-2.5 py-1.5 rounded-md border border-red-500/50 text-red-500"
          onClick={() => {
            const titles = tracks.filter((t) => ids.includes(t.id)).map((t) => t.title)
            const rest = titles.length - 3
            const msg = `${titles.length}곡 삭제: ${titles.slice(0, 3).join(', ')}${rest > 0 ? ` 외 ${rest}곡` : ''} — 되돌릴 수 없습니다.`
            if (confirm(msg)) runBulk(ids, clear, {}, (prev) => prev.filter((t) => !ids.includes(t.id)), true)
          }}
        >
          삭제
        </button>
      </>
    )
  }

  return (
    <div className="xl:flex xl:gap-4 xl:items-start">
      <div className="flex-1 min-w-0">
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => openPanel(null)} className="px-3 py-1.5 bg-text-primary text-bg text-sm rounded-md">
            + 추가
          </button>
        </div>
        <AdminTable
          items={tracks}
          columns={columns}
          filterGroups={filterGroups}
          searchFields={searchFields}
          searchPlaceholder="제목·아티스트·메모 검색"
          initialState={initialState}
          defaultSort={DEFAULT_SORT}
          card={(t) => (
            <span className="flex items-center gap-3">
              {t.cover ? <img src={t.cover} alt="" loading="lazy" className="w-10 h-10 rounded object-cover shrink-0" /> : <span className="w-10 h-10 rounded bg-surface shrink-0" />}
              <span className="min-w-0">
                <span className="block text-sm text-text-primary truncate">{t.favorite && <span className="text-accent">★ </span>}{t.title}</span>
                <span className="block text-xs text-text-muted truncate">{t.artist} · {t.genre ?? '장르 없음'}</span>
              </span>
            </span>
          )}
          onOpen={openPanel}
          activeId={panel.open ? panel.item?.id ?? null : null}
          flashId={flashId}
          bulkActions={bulkActions}
          unit="곡"
        />
      </div>
      <AdminSidePanel open={panel.open} focusKey={panel.version} title={panel.item ? '곡 수정' : '곡 추가'} dirty={dirty} onClose={closePanel}>
        <TrackForm
          key={`${panel.item?.id ?? 'new'}-${panel.version}`}
          item={panel.item}
          genres={genres}
          onSaved={handleSaved}
          onDirtyChange={setDirty}
        />
      </AdminSidePanel>
    </div>
  )
}

// 일괄 장르 바꾸기: 작은 펼침 상자 안에서 장르를 고르거나 입력하고 적용.
function BulkGenre({ genres, onApply }: { genres: string[]; onApply: (genre: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer px-2.5 py-1.5 rounded-md border border-border">장르 바꾸기 ▾</summary>
      <div className="absolute bottom-full mb-2 left-0 w-72 p-3 rounded-lg border border-border bg-bg-secondary shadow-lg space-y-2">
        <GenreInput value={value} onChange={setValue} genres={genres} />
        <button
          type="button"
          onClick={(e) => {
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
