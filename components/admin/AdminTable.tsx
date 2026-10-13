'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  applyFilters, listStateToQuery, matchesQuery, paginate, sortItems,
  type FilterDef, type ListState, type SortValue,
} from '@/lib/adminList'

export interface Column<T> {
  key: string
  label: string
  sortValue?: (item: T) => SortValue
  render: (item: T) => React.ReactNode
  className?: string
}

export interface FilterGroup<T> {
  group: string
  label?: string
  filters: FilterDef<T>[]
}

interface Props<T extends { id: number }> {
  items: T[]
  columns: Column<T>[]
  filterGroups: FilterGroup<T>[]
  searchFields: (item: T) => (string | null | undefined)[]
  searchPlaceholder: string
  initialState: ListState
  defaultSort: string
  card: (item: T) => React.ReactNode
  onOpen: (item: T) => void
  activeId: number | null
  flashId: number | null
  bulkActions: (ids: number[], clear: () => void) => React.ReactNode
  unit: string
}

// 관리자 음악·책 공용 목록. 거르기·정렬·쪽 계산은 lib/adminList 순수 함수가 하고, 여기는 화면과 상태만.
// 상태는 주소에도 남기되 history.replaceState로만 — router.replace는 서버 왕복이라 글자마다 목록을 다시 받는다.
export default function AdminTable<T extends { id: number }>({
  items, columns, filterGroups, searchFields, searchPlaceholder, initialState, defaultSort,
  card, onOpen, activeId, flashId, bulkActions, unit,
}: Props<T>) {
  const [state, setState] = useState<ListState>(initialState)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const allDefs = useMemo(() => filterGroups.flatMap((g) => g.filters), [filterGroups])
  const filtered = useMemo(() => {
    const searched = items.filter((it) => matchesQuery(searchFields(it), state.q))
    return applyFilters(searched, allDefs, state.filters)
  }, [items, searchFields, state.q, state.filters, allDefs])
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === state.sort && c.sortValue)
    return col?.sortValue ? sortItems(filtered, col.sortValue, state.dir) : filtered
  }, [filtered, columns, state.sort, state.dir])
  const pageData = paginate(sorted, state.page)

  // 주소 반영. 검색어 입력 중엔 300ms 모아서 한 번.
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = listStateToQuery({ ...state, page: pageData.page }, defaultSort)
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      // 첫 인자는 null — Next가 내부 state를 복사해 라우터 주소도 같이 갱신한다. history.state(__NA:true)를 넘기면
      // 라우터가 이 변경을 모르고, 나중에 router.refresh() 때 처음 열었던 주소로 되돌려 놓는다.
      window.history.replaceState(null, '', url)
    }, 300)
    return () => clearTimeout(t)
  }, [state, pageData.page, defaultSort])

  // 검색·필터가 바뀌면 선택을 비운다 — 안 보이는 항목에 일괄 작업이 걸리는 사고 방지. 쪽은 1쪽으로.
  function changeQuery(patch: Partial<Pick<ListState, 'q' | 'filters'>>) {
    setState((s) => ({ ...s, ...patch, page: 1 }))
    setSelected(new Set())
  }

  function toggleFilter(group: string, id: string) {
    const next = { ...state.filters }
    if (next[group] === id) delete next[group]
    else next[group] = id
    changeQuery({ filters: next })
  }

  function toggleSort(key: string) {
    setState((s) => ({
      ...s,
      sort: key,
      dir: s.sort === key ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc',
      page: 1,
    }))
  }

  // 목록에서 사라진 항목(삭제됨)은 선택에서도 뺀다.
  const liveSelected = useMemo(() => {
    const ids = new Set(items.map((i) => i.id))
    return [...selected].filter((id) => ids.has(id))
  }, [selected, items])

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id))

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((i) => i.id)))
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clear = () => setSelected(new Set())
  const sortableColumns = columns.filter((c) => c.sortValue)

  return (
    <div className="space-y-3 pb-20">
      <input
        type="search"
        value={state.q}
        onChange={(e) => changeQuery({ q: e.target.value })}
        placeholder={searchPlaceholder}
        aria-label="검색"
        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg"
      />

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => changeQuery({ q: '', filters: {} })}
          aria-pressed={!state.q && Object.keys(state.filters).length === 0}
          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
            !state.q && Object.keys(state.filters).length === 0
              ? 'border-accent text-accent'
              : 'border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          전체 <span className="text-text-muted">{items.length}</span>
        </button>
        {/* 칩이 하나도 없는 묶음(장르가 아직 없는 책 등)은 이름표만 남지 않게 뺀다 */}
        {filterGroups.filter((g) => g.filters.length > 0).map((g) => (
          <div key={g.group} className="flex flex-wrap items-center gap-1.5">
            {g.label && <span className="text-xs text-text-muted mr-1">{g.label}</span>}
            {g.filters.map((f) => {
              const on = state.filters[g.group] === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFilter(g.group, f.id)}
                  aria-pressed={on}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    on ? 'border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f.label} <span className="text-text-muted">{items.filter(f.test).length}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {filtered.length === items.length ? `전체 ${items.length}${unit}` : `${filtered.length}${unit} / 전체 ${items.length}${unit}`}
        </span>
        {/* 좁은 화면엔 열 머리가 없으니 정렬을 선택 상자로 */}
        <label className="sm:hidden flex items-center gap-1">
          정렬
          <select
            value={`${state.sort}:${state.dir}`}
            onChange={(e) => {
              const [sort, dir] = e.target.value.split(':') as [string, 'asc' | 'desc']
              setState((s) => ({ ...s, sort, dir, page: 1 }))
            }}
            className="border border-border rounded px-1.5 py-1 bg-bg"
          >
            {sortableColumns.flatMap((c) => [
              <option key={`${c.key}:asc`} value={`${c.key}:asc`}>{c.label} ↑</option>,
              <option key={`${c.key}:desc`} value={`${c.key}:desc`}>{c.label} ↓</option>,
            ])}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-text-secondary py-10 text-sm border border-border rounded-xl">
          {items.length === 0 ? `아직 없습니다. [+ 추가]로 시작하세요.` : '조건에 맞는 항목이 없습니다.'}
        </p>
      ) : (
        <>
          {/* 640px 이상: 표 */}
          <table className="hidden sm:table w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead className="bg-bg-secondary text-text-secondary text-xs">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    aria-label={`걸러진 ${filtered.length}${unit} 모두 선택`}
                  />
                </th>
                {columns.map((c) => {
                  const active = state.sort === c.key
                  return (
                    <th
                      key={c.key}
                      className={`px-3 py-2 text-left font-medium ${c.className ?? ''}`}
                      aria-sort={active ? (state.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {c.sortValue ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className="hover:text-text-primary">
                          {c.label} {active ? (state.dir === 'asc' ? '▲' : '▼') : ''}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.items.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${item.id === activeId ? 'bg-surface' : ''} ${
                    item.id === flashId ? 'bg-accent-soft' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleOne(item.id)}
                      aria-label="선택"
                    />
                  </td>
                  {columns.map((c, i) => (
                    <td key={c.key} className={`px-3 py-2 ${c.className ?? ''}`}>
                      {i === columns.findIndex((col) => col.key === 'title') ? (
                        <button
                          type="button"
                          onClick={() => onOpen(item)}
                          className="text-left text-text-primary hover:text-accent font-medium"
                        >
                          {c.render(item)}
                        </button>
                      ) : (
                        c.render(item)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 640px 미만: 한 줄 카드 */}
          <ul className="sm:hidden border border-border rounded-xl divide-y divide-border">
            {pageData.items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2 ${item.id === activeId ? 'bg-surface' : ''} ${
                  item.id === flashId ? 'bg-accent-soft' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleOne(item.id)}
                  aria-label="선택"
                  className="w-5 h-5 shrink-0"
                />
                <button type="button" onClick={() => onOpen(item)} className="flex-1 min-w-0 text-left">
                  {card(item)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {pageData.pageCount > 1 && (
        <nav className="flex justify-center gap-1" aria-label="쪽">
          {Array.from({ length: pageData.pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setState((s) => ({ ...s, page: n }))}
              aria-current={n === pageData.page ? 'page' : undefined}
              className={`min-w-9 h-9 px-2 rounded-md text-sm ${
                n === pageData.page ? 'bg-text-primary text-bg' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}

      {liveSelected.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg-secondary/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-text-primary mr-2">
              {allFilteredSelected && filtered.length === liveSelected.length
                ? `걸러진 ${filtered.length}${unit} 모두 선택됨`
                : `${liveSelected.length}${unit} 선택됨`}
            </span>
            {bulkActions(liveSelected, clear)}
            <button type="button" onClick={clear} className="ml-auto text-text-secondary hover:text-text-primary">
              선택 해제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
