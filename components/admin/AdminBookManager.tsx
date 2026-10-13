'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Book } from '@prisma/client'
import AdminTable, { type Column, type FilterGroup } from './AdminTable'
import AdminSidePanel, { confirmDiscard } from './AdminSidePanel'
import BulkGenre from './BulkGenre'
import BookForm, { STATUS_LABEL, type Status } from './BookForm'
import { sendBulk } from '@/lib/adminFetch'
import { dateValue, genreCounts, parseListState, type RawParams } from '@/lib/adminList'

const DEFAULT_SORT = 'createdAt'
const SORT_KEYS = ['title', 'author', 'genre', 'status', 'rating', 'createdAt']
const GROUPS = ['status', 'flag', 'genre']
const STATUS_ORDER: Record<Status, number> = { reading: 0, want: 1, done: 2 }

const searchFields = (b: Book) => [b.title, b.author, b.memo]

const columns: Column<Book>[] = [
  { key: 'title', label: '제목', sortValue: (b) => b.title, render: (b) => b.title },
  { key: 'author', label: '저자', sortValue: (b) => b.author, render: (b) => <span className="text-text-secondary">{b.author}</span> },
  { key: 'genre', label: '장르', className: 'whitespace-nowrap', sortValue: (b) => b.genre, render: (b) => b.genre ?? <span className="text-text-muted">—</span> },
  { key: 'status', label: '상태', className: 'w-24', sortValue: (b) => STATUS_ORDER[b.status as Status], render: (b) => STATUS_LABEL[b.status as Status] },
  {
    key: 'rating',
    label: '별점',
    className: 'w-24',
    sortValue: (b) => (b.status === 'done' ? b.rating : null),
    render: (b) => (b.status === 'done' && b.rating ? <span className="text-accent">{'★'.repeat(b.rating)}</span> : <span className="text-text-muted">—</span>),
  },
  {
    key: 'createdAt',
    label: '추가한 날',
    className: 'w-24 text-text-muted',
    sortValue: (b) => dateValue(b.createdAt),
    render: (b) => new Date(b.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' }),
  },
]

interface Props {
  initialBooks: Book[]
  initialQuery: RawParams
}

export default function AdminBookManager({ initialBooks, initialQuery }: Props) {
  const router = useRouter()
  const [books, setBooks] = useState(initialBooks)
  // router.refresh()로 서버 목록이 새로 오면 그걸로 바꾼다(렌더 중 이전 값 비교 — NavBar와 같은 패턴).
  const [prevInitial, setPrevInitial] = useState(initialBooks)
  if (prevInitial !== initialBooks) {
    setPrevInitial(initialBooks)
    setBooks(initialBooks)
  }

  const [initialState] = useState(() => parseListState(initialQuery, GROUPS, SORT_KEYS, DEFAULT_SORT))
  const [panel, setPanel] = useState<{ open: boolean; item: Book | null; version: number }>({ open: false, item: null, version: 0 })
  // 열린 폼이 건네준 '저장 안 한 수정 있음?' 함수. 이벤트 처리 중에만 부른다.
  const dirtyCheck = useRef<() => boolean>(() => false)
  const registerDirtyCheck = useCallback((check: () => boolean) => {
    dirtyCheck.current = check
  }, [])
  const isDirty = useCallback(() => dirtyCheck.current(), [])
  const [flashId, setFlashId] = useState<number | null>(null)

  const genres = useMemo(() => genreCounts(books).map((g) => g.genre), [books])

  const filterGroups = useMemo<FilterGroup<Book>[]>(
    () => [
      {
        group: 'status',
        filters: (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({
          group: 'status', id: s, label: STATUS_LABEL[s], test: (b: Book) => b.status === s,
        })),
      },
      {
        group: 'flag',
        filters: [
          { group: 'flag', id: 'nogenre', label: '장르 없음', test: (b) => !b.genre },
          { group: 'flag', id: 'norating', label: '별점 없음', test: (b) => b.status === 'done' && b.rating == null },
        ],
      },
      {
        group: 'genre',
        label: '장르:',
        filters: genres.map((g) => ({ group: 'genre', id: g, label: g, test: (b: Book) => b.genre === g })),
      },
    ],
    [genres]
  )

  function openPanel(item: Book | null) {
    if (panel.open && !confirmDiscard(isDirty())) return
    setPanel((p) => ({ open: true, item, version: p.version + 1 }))
  }

  const closePanel = useCallback(() => {
    setPanel((p) => ({ ...p, open: false, item: null }))
  }, [])

  function handleSaved(saved: Book) {
    setBooks((prev) => (prev.some((b) => b.id === saved.id) ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev]))
    setPanel((p) => ({ open: true, item: saved, version: p.version + 1 }))
    setFlashId(saved.id)
    setTimeout(() => setFlashId((id) => (id === saved.id ? null : id)), 1500)
  }

  // 열린 패널의 책이 일괄 대상이면: 저장 안 한 수정이 있으면 먼저 묻고, 끝나면 패널을 새 값으로 다시 채운다.
  function guardOpenItem(ids: number[]): boolean {
    if (!panel.item || !ids.includes(panel.item.id) || !isDirty()) return true
    return confirm('패널에서 고치던 내용은 사라집니다. 계속할까요?')
  }

  // 응답을 기다리는 동안 ★ 토글·패널 저장·다른 줄 열기가 끼어들 수 있다 — 클릭 당시 값이 아니라
  // 함수형 갱신으로 그때의 최신 목록·패널에 적용한다.
  async function runBulk(ids: number[], clear: () => void, body: object, apply: (prev: Book[]) => Book[], isDelete = false) {
    if (!guardOpenItem(ids)) return
    try {
      const count = await sendBulk('/api/books', isDelete ? 'DELETE' : 'PATCH', { ids, ...body })
      setBooks((prev) => apply(prev))
      clear()
      setPanel((p) => {
        if (!p.item || !ids.includes(p.item.id)) return p
        if (isDelete) return { open: false, item: null, version: p.version + 1 }
        return { ...p, item: apply([p.item])[0] ?? null, version: p.version + 1 }
      })
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
              return prev.map((b) => (ids.includes(b.id) ? { ...b, genre: canonical } : b))
            })
          }
        />
        <select
          aria-label="상태 바꾸기"
          value=""
          onChange={(e) => {
            const status = e.target.value as Status
            if (status) runBulk(ids, clear, { set: { status } }, (prev) => prev.map((b) => (ids.includes(b.id) ? { ...b, status } : b)))
          }}
          className="px-2 py-1.5 rounded-md border border-border bg-bg"
        >
          <option value="">상태 바꾸기…</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button
          type="button"
          className="px-2.5 py-1.5 rounded-md border border-red-500/50 text-red-500"
          onClick={() => {
            const titles = books.filter((b) => ids.includes(b.id)).map((b) => b.title)
            const rest = titles.length - 3
            const msg = `${titles.length}권 삭제: ${titles.slice(0, 3).join(', ')}${rest > 0 ? ` 외 ${rest}권` : ''} — 되돌릴 수 없습니다.`
            if (confirm(msg)) runBulk(ids, clear, {}, (prev) => prev.filter((b) => !ids.includes(b.id)), true)
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
          items={books}
          columns={columns}
          filterGroups={filterGroups}
          searchFields={searchFields}
          searchPlaceholder="제목·저자·메모 검색"
          initialState={initialState}
          defaultSort={DEFAULT_SORT}
          card={(b) => (
            <span className="block min-w-0">
              <span className="block text-sm text-text-primary truncate">{b.title}</span>
              <span className="block text-xs text-text-muted truncate">
                {b.author} · {STATUS_LABEL[b.status as Status]}{b.genre ? ` · ${b.genre}` : ''}
              </span>
            </span>
          )}
          onOpen={openPanel}
          activeId={panel.open ? panel.item?.id ?? null : null}
          flashId={flashId}
          bulkActions={bulkActions}
          unit="권"
        />
      </div>
      <AdminSidePanel open={panel.open} focusKey={panel.version} title={panel.item ? '책 수정' : '책 추가'} isDirty={isDirty} onClose={closePanel}>
        <BookForm
          key={`${panel.item?.id ?? 'new'}-${panel.version}`}
          item={panel.item}
          genres={genres}
          onSaved={handleSaved}
          registerDirtyCheck={registerDirtyCheck}
        />
      </AdminSidePanel>
    </div>
  )
}
