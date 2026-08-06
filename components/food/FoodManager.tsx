'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APIProvider } from '@vis.gl/react-google-maps'
import type { Restaurant } from '@prisma/client'
import FoodMap from './FoodMap'
import PlaceSearch, { type PickedPlace } from './PlaceSearch'

const CATEGORY_PRESETS = ['한식', '일식', '중식', '양식', '카페', '술집']

interface Props {
  initial: Restaurant[]
  apiKey: string
  mapId: string
}

type Draft = PickedPlace & { category: string; menus: string; memo: string }

export default function FoodManager({ initial, apiKey, mapId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<
    { id: number; category: string; menus: string; memo: string } | null
  >(null)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of initial) {
      if (r.category) counts.set(r.category, (counts.get(r.category) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [initial])

  const visible = filter ? initial.filter((r) => r.category === filter) : initial

  async function save() {
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          lat: draft.lat,
          lng: draft.lng,
          address: draft.address,
          placeId: draft.placeId,
          category: draft.category,
          menus: draft.menus,
          memo: draft.memo,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? '저장에 실패했습니다.')
        return
      }
      setDraft(null)
      router.refresh()
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  // 가게명·좌표는 구글에서 받은 값이라 수정 대상이 아니다.
  // 사람이 쓴 것(카테고리·메뉴·메모)만 고칠 수 있게 한다.
  async function saveEdit() {
    if (!editing) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          category: editing.category,
          menus: editing.menus,
          memo: editing.memo,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : '수정에 실패했습니다.')
        return
      }
      setEditing(null)
      router.refresh()
    } catch {
      setError('수정에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('이 맛집을 삭제할까요?')) return
    setBusy(true)
    try {
      await fetch('/api/restaurants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (selected?.id === id) setSelected(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  // 키나 Map ID가 없으면 지도가 깨진 채로 뜨는 대신 무엇이 빠졌는지 알려준다.
  // (Map ID 없이는 AdvancedMarker가 렌더되지 않아 핀이 조용히 사라진다)
  const missing = [
    !apiKey && 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    !mapId && 'NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID',
  ].filter(Boolean) as string[]

  if (missing.length > 0) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-semibold">구글 지도 설정이 아직 없습니다.</p>
        <p className="mt-2 text-xs leading-relaxed">
          <code>.env</code>에 다음 항목을 추가한 뒤 앱을 다시 빌드하면 지도가 표시됩니다:
        </p>
        <ul className="mt-1.5 list-inside list-disc text-xs">
          {missing.map((k) => (
            <li key={k}>
              <code>{k}</code>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col gap-5">
        <FoodMap
          restaurants={visible}
          selected={selected}
          onSelect={setSelected}
          draft={draft ? { lat: draft.lat, lng: draft.lng, name: draft.name } : null}
          mapId={mapId}
        />

        {/* 추가 폼 */}
        <section className="rounded-xl border border-border bg-bg-secondary p-5">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">맛집 추가</h2>
          <PlaceSearch
            onPick={(p) => {
              setDraft({ ...p, category: '', menus: '', memo: '' })
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
                  {CATEGORY_PRESETS.map((c) => (
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
                    value={CATEGORY_PRESETS.includes(draft.category) ? '' : draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder="직접 입력"
                    className="w-24 rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <input
                value={draft.menus}
                onChange={(e) => setDraft({ ...draft, menus: e.target.value })}
                placeholder="추천 메뉴 (예: 우니동, 사케동)"
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              <input
                value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                placeholder="메모 (예: 웨이팅 김, 평일 낮 추천)"
                className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={busy}
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
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !filter
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              전체 {initial.length}
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                onClick={() => setFilter(name)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filter === name
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {name} {count}
              </button>
            ))}
          </div>

          {/* 수정/삭제 중 발생한 오류 (추가 폼이 닫혀 있어도 보이도록 목록 위에 둔다) */}
          {error && !draft && <p className="mb-2 text-xs text-red-500">{error}</p>}

          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">
              {initial.length === 0 ? '아직 등록한 맛집이 없습니다.' : '이 카테고리엔 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((r) =>
                editing?.id === r.id ? (
                  <li key={r.id} className="flex flex-col gap-2 py-3">
                    <p className="text-sm font-medium text-text-primary">{r.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_PRESETS.map((c) => (
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
                      value={editing.menus}
                      onChange={(e) => setEditing({ ...editing, menus: e.target.value })}
                      placeholder="추천 메뉴"
                      className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                    <input
                      value={editing.memo}
                      onChange={(e) => setEditing({ ...editing, memo: e.target.value })}
                      placeholder="메모"
                      className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={busy}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null)
                          setError(null)
                        }}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                      >
                        취소
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={r.id} className="flex items-start justify-between gap-4 py-3">
                    <button
                      onClick={() => setSelected(r)}
                      className="group min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-text-primary transition-colors group-hover:text-accent-hover">
                          {r.name}
                        </span>
                        {r.category && <span className="text-xs text-accent">{r.category}</span>}
                      </span>
                      {r.menus && (
                        <span className="mt-0.5 block text-xs text-text-secondary">🍽 {r.menus}</span>
                      )}
                      {r.memo && <span className="mt-0.5 block text-xs text-text-muted">{r.memo}</span>}
                    </button>
                    <div className="flex shrink-0 gap-3">
                      <button
                        onClick={() => {
                          setEditing({
                            id: r.id,
                            category: r.category ?? '',
                            menus: r.menus ?? '',
                            memo: r.memo ?? '',
                          })
                          setError(null)
                        }}
                        disabled={busy}
                        className="text-xs text-text-muted transition-colors hover:text-accent disabled:opacity-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        disabled={busy}
                        className="text-xs text-text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </div>
    </APIProvider>
  )
}
