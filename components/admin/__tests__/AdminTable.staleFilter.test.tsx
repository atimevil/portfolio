// @vitest-environment jsdom
// 고른 장르의 마지막 항목이 바뀌어 장르가 없어지면, 말없이 목록이 넓어지지 않고 필터를 풀었다고 알린다.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import AdminTable, { type Column, type FilterGroup } from '../AdminTable'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Row = { id: number; title: string; genre: string | null }
const columns: Column<Row>[] = [{ key: 'title', label: '제목', render: (r) => r.title }]
const groupsFor = (rows: Row[]): FilterGroup<Row>[] => [
  {
    group: 'genre',
    filters: [...new Set(rows.map((r) => r.genre).filter((g): g is string => !!g))].map((g) => ({
      group: 'genre', id: g, label: g, test: (r: Row) => r.genre === g,
    })),
  },
]

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function render(rows: Row[]) {
  act(() => {
    root.render(
      <AdminTable<Row>
        items={rows}
        columns={columns}
        filterGroups={groupsFor(rows)}
        searchFields={(r) => [r.title]}
        searchPlaceholder="검색"
        initialState={{ q: '', filters: { genre: 'rock' }, sort: 'title', dir: 'asc', page: 1 }}
        defaultSort="title"
        card={(r) => r.title}
        onOpen={() => {}}
        activeId={null}
        flashId={null}
        bulkActions={() => null}
        unit="곡"
      />,
    )
  })
}

describe('AdminTable 사라진 필터', () => {
  it('필터에 걸린 장르가 없어지면 필터를 풀고 알린다', () => {
    const rock = [{ id: 1, title: 'A', genre: 'rock' }, { id: 2, title: 'B', genre: 'pop' }]
    render(rock)
    expect(host.textContent).not.toContain('필터를 풀었습니다')
    expect(host.textContent).toContain('A')
    expect(host.textContent).not.toContain('B')
    // 마지막 rock 곡의 장르가 바뀜
    render([{ id: 1, title: 'A', genre: 'pop' }, { id: 2, title: 'B', genre: 'pop' }])
    expect(host.querySelector('[role="status"]')?.textContent).toContain('‘rock’ 필터를 풀었습니다')
    expect(host.textContent).toContain('B')
  })
})
