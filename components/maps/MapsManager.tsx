'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Place } from '@prisma/client'
import type { PlaceType } from '@/lib/places'
import PlaceSearch, { type PickedPlace } from './PlaceSearch'

// Leaflet은 브라우저 window를 필요로 해 서버에서 렌더링할 수 없다.
const PlacesMap = dynamic(() => import('./PlacesMap'), { ssr: false })
import PhotoUpload from './PhotoUpload'
import PhotoCleanup from './PhotoCleanup'

// 종류별로 쓰는 말과 자주 쓰는 카테고리가 다르다.
const TYPE_CONFIG = {
  food: {
    label: '맛집',
    itemsLabel: '추천 메뉴',
    itemsPlaceholder: '추천 메뉴 (예: 우니동, 사케동)',
    searchPlaceholder: '가게명 검색 (예: 스시로 시부야점)',
    categories: ['한식', '일식', '중식', '양식', '카페', '술집'],
  },
  shopping: {
    label: '쇼핑',
    itemsLabel: '살 것',
    itemsPlaceholder: '살 것 / 브랜드 (예: 니트, 향수)',
    searchPlaceholder: '매장명 검색 (예: 빔즈 하라주쿠)',
    categories: ['편집샵', '의류', '잡화', '서점', '전자', '기념품'],
  },
} as const

type Tab = 'all' | PlaceType

interface Props {
  initial: Place[]
}

type Draft = PickedPlace & {
  type: PlaceType
  category: string
  items: string
  memo: string
  photo: string
}

// 수정 대상은 사람이 쓴 값만. 종류(type)는 목록의 원본 레코드에서 읽으므로 여기 담지 않는다.
type Editing = {
  id: number
  category: string
  items: string
  memo: string
  photo: string
}

export default function MapsManager({ initial }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  // 선택은 id로만 기억하고 장소는 최신 목록에서 찾는다. 장소 객체를 통째로 들고 있으면 수정한 뒤에도
  // 정보창이 옛 사진·메모를 보여준다.
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = initial.find((p) => p.id === selectedId) ?? null
  const [draft, setDraft] = useState<Draft | null>(null)
  // 새로 등록할 때 어떤 종류로 넣을지 (검색 전에 미리 고른다)
  const [addType, setAddType] = useState<PlaceType>('food')
  const [filter, setFilter] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 목록 쪽(수정·삭제) 오류. 등록 폼의 오류(error)와 따로 둔다 — 한 칸을 같이 쓰면 수정 실패가 등록 폼 안에 떴다.
  const [listError, setListError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  // 사진을 올리는 중 — 끝나기 전에 저장하면 사진 없이 저장된다
  const [uploading, setUploading] = useState(false)

  const byTab = tab === 'all' ? initial : initial.filter((p) => p.type === tab)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of byTab) {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [byTab])

  // 고른 카테고리가 목록에서 사라졌으면(마지막 한 곳을 지우거나 카테고리를 바꿈) 필터를 없는 것으로 본다.
  // 안 그러면 "이 카테고리엔 없습니다"에 갇히고, 남은 카테고리가 없으면 필터 버튼 줄도 사라져 풀 수가 없었다.
  const activeFilter = filter && categories.some(([name]) => name === filter) ? filter : null
  const visible = activeFilter ? byTab.filter((p) => p.category === activeFilter) : byTab

  const counts = {
    all: initial.length,
    food: initial.filter((p) => p.type === 'food').length,
    shopping: initial.filter((p) => p.type === 'shopping').length,
  }

  function switchTab(next: Tab) {
    setTab(next)
    setFilter(null) // 탭이 바뀌면 카테고리 목록도 달라지므로 필터 초기화
    setEditing(null)
  }

  async function save() {
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draft.type,
          name: draft.name,
          lat: draft.lat,
          lng: draft.lng,
          address: draft.address,
          placeId: draft.placeId,
          category: draft.category,
          items: draft.items,
          memo: draft.memo,
          photo: draft.photo,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : '저장에 실패했습니다.')
        return
      }
      // 보고 있는 탭과 다른 종류를 저장하면 목록에서 안 보여 저장이 실패한 것처럼 느껴진다.
      // 방금 저장한 종류가 보이는 탭으로 옮겨준다.
      if (tab !== 'all' && tab !== draft.type) {
        setTab(draft.type)
        setFilter(null)
      }
      setDraft(null)
      router.refresh()
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  // 이름·좌표는 구글에서 받은 값이라 수정 대상이 아니다.
  // 사람이 쓴 것(카테고리·항목·메모·사진)만 고칠 수 있게 한다.
  async function saveEdit() {
    if (!editing) return
    setBusy(true)
    setListError(null)
    try {
      const res = await fetch('/api/places', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          category: editing.category,
          items: editing.items,
          memo: editing.memo,
          photo: editing.photo,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setListError(typeof body.error === 'string' ? body.error : '수정에 실패했습니다.')
        return
      }
      setEditing(null)
      router.refresh()
    } catch {
      setListError('수정에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('이 장소를 삭제할까요?')) return
    setBusy(true)
    setListError(null)
    try {
      const res = await fetch('/api/places', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      // 실패(로그인 만료 등)를 성공처럼 넘기지 않는다
      if (!res.ok) {
        setListError('삭제에 실패했습니다.')
        return
      }
      setSelectedId((cur) => (cur === id ? null : cur))
      router.refresh()
    } catch {
      setListError('삭제에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const addCfg = TYPE_CONFIG[addType]

  return (
    <div className="flex flex-col gap-5">
        {/* 종류 탭 */}
        <div className="flex gap-1 border-b border-border">
          {([
            ['all', `전체 ${counts.all}`],
            ['food', `🍽 맛집 ${counts.food}`],
            ['shopping', `🛍 쇼핑 ${counts.shopping}`],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                tab === key
                  ? 'border-accent font-semibold text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <PlacesMap
          places={visible}
          selected={selected}
          onSelect={(p) => setSelectedId(p ? p.id : null)}
          onDeselect={(id) => setSelectedId((cur) => (cur === id ? null : cur))}
          draft={draft ? { lat: draft.lat, lng: draft.lng } : null}
        />

        {/* 추가 폼 */}
        <section className="tile p-5">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-sm font-semibold text-text-primary">장소 추가</h2>
            <div className="flex gap-1">
              {(['food', 'shopping'] as PlaceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setAddType(t)
                    setDraft(null)
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    addType === t
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          <PlaceSearch
            placeholder={addCfg.searchPlaceholder}
            onPick={(p) => {
              setDraft({ ...p, type: addType, category: '', items: '', memo: '', photo: '' })
              setError(null)
            }}
          />

          {draft && (
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">{draft.name}</p>
                {draft.address && <p className="text-xs text-text-muted">{draft.address}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-text-muted">카테고리</label>
                <div className="flex flex-wrap gap-1.5">
                  {addCfg.categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft({ ...draft, category: draft.category === c ? '' : c })}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        draft.category === c
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <input
                    value={
                      (addCfg.categories as readonly string[]).includes(draft.category)
                        ? ''
                        : draft.category
                    }
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder="직접 입력"
                    className="w-24 rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <input
                value={draft.items}
                onChange={(e) => setDraft({ ...draft, items: e.target.value })}
                placeholder={addCfg.itemsPlaceholder}
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              <input
                value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                placeholder="메모 (예: 웨이팅 김, 평일 낮 추천)"
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />

              <div>
                <label className="mb-1.5 block text-xs text-text-muted">사진</label>
                {/* 올리는 동안 다른 칸을 고치거나 취소할 수 있다. 끝났을 때 "지금" 폼에 사진만 얹는다 —
                    고를 때의 폼으로 되돌리면 그 사이 쓴 메모가 지워지고, 취소한 폼이 되살아난다. */}
                <PhotoUpload
                  value={draft.photo}
                  onBusyChange={setUploading}
                  onChange={(url) =>
                    setDraft((d) => (d && d.lat === draft.lat && d.lng === draft.lng ? { ...d, photo: url } : d))
                  }
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={busy || uploading}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy ? '저장 중…' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setDraft(null)
                    setError(null)
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 목록 */}
        <section>
          {categories.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilter(null)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  !activeFilter
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                전체 {byTab.length}
              </button>
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setFilter(name)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeFilter === name
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {name} {count}
                </button>
              ))}
            </div>
          )}

          {listError && <p className="mb-2 text-xs text-red-500">{listError}</p>}

          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">
              {byTab.length === 0 ? '아직 등록한 곳이 없습니다.' : '이 카테고리엔 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((p) => {
                const cfg = TYPE_CONFIG[p.type === 'shopping' ? 'shopping' : 'food']
                return editing?.id === p.id ? (
                  <li key={p.id} className="flex flex-col gap-2 py-3">
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cfg.categories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() =>
                            setEditing({ ...editing, category: editing.category === c ? '' : c })
                          }
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            editing.category === c
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input
                      value={editing.items}
                      onChange={(e) => setEditing({ ...editing, items: e.target.value })}
                      placeholder={cfg.itemsLabel}
                      className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                    <input
                      value={editing.memo}
                      onChange={(e) => setEditing({ ...editing, memo: e.target.value })}
                      placeholder="메모"
                      className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                    <PhotoUpload
                      value={editing.photo}
                      onBusyChange={setUploading}
                      onChange={(url) => setEditing((e) => (e && e.id === editing.id ? { ...e, photo: url } : e))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={busy || uploading}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null)
                          setListError(null)
                        }}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                      >
                        취소
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={p.id} className="flex items-start justify-between gap-4 py-3">
                    <button onClick={() => setSelectedId(p.id)} className="group flex min-w-0 flex-1 gap-3 text-left">
                      {p.photo && (
                        <img src={p.photo} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                      )}
                      <span className="min-w-0">
                        <span className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-text-primary transition-colors group-hover:text-accent-hover">
                            {p.name}
                          </span>
                          {p.category && <span className="text-xs text-accent">{p.category}</span>}
                        </span>
                        <span className="hidden group-hover:block">
                          {p.items && (
                            <span className="mt-0.5 block text-xs text-text-secondary">
                              {p.type === 'shopping' ? '🛍' : '🍽'} {p.items}
                            </span>
                          )}
                          {p.memo && <span className="mt-0.5 block text-xs text-text-muted">{p.memo}</span>}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-3">
                      <button
                        onClick={() => {
                          setEditing({
                            id: p.id,
                            category: p.category ?? '',
                            items: p.items ?? '',
                            memo: p.memo ?? '',
                            photo: p.photo ?? '',
                          })
                          setListError(null)
                        }}
                        disabled={busy}
                        className="text-xs text-text-muted transition-colors hover:text-accent disabled:opacity-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        disabled={busy}
                        className="text-xs text-text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 등록·수정 중에는 숨긴다. 방금 올렸지만 아직 저장 안 한 사진도 "안 쓰는 사진"이라, 정리하면 지워진다. */}
        {!draft && !editing && <PhotoCleanup />}
      </div>
  )
}
