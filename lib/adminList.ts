// 관리자 음악·책 목록을 브라우저에서 거르고 정렬하는 순수 함수들. 수백 건이라 서버 쪽 쪽 나누기 없이
// 전체를 받아 여기서 처리한다. 주소(?q=&genre=…)와 화면 상태 사이의 변환도 여기서 한다.

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

export interface FilterDef<T> {
  group: string
  id: string
  label: string
  test: (item: T) => boolean
}

export interface ListState {
  q: string
  filters: Record<string, string>
  sort: string
  dir: SortDir
  page: number
}

export type RawParams = Record<string, string | string[] | undefined>

export const PAGE_SIZE = 50

export function normalizeQuery(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function matchesQuery(fields: (string | null | undefined)[], q: string): boolean {
  const needle = normalizeQuery(q)
  if (!needle) return true
  return fields.some((f) => f != null && normalizeQuery(f).includes(needle))
}

// 그룹마다 하나씩 고른 필터를 모두 만족해야 한다. 정의에 없는 id(주소에 남은 옛 장르 등)는 무시.
export function applyFilters<T>(items: T[], defs: FilterDef<T>[], active: Record<string, string>): T[] {
  const tests = Object.entries(active)
    .map(([group, id]) => defs.find((d) => d.group === group && d.id === id)?.test)
    .filter((t): t is (item: T) => boolean => !!t)
  return tests.length ? items.filter((item) => tests.every((t) => t(item))) : items
}

const collator = new Intl.Collator('ko', { sensitivity: 'base', numeric: true })

// 빈 값(장르 없음 등)은 방향과 상관없이 맨 뒤 — 채워야 할 항목이 정렬 때마다 위아래로 튀지 않게.
export function sortItems<T>(items: T[], value: (item: T) => SortValue, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const ea = va == null || va === ''
    const eb = vb == null || vb === ''
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sign
    return collator.compare(String(va), String(vb)) * sign
  })
}

// 서버 컴포넌트가 넘긴 목록은 Date, 저장 후 res.json()으로 받은 항목은 문자열이라 둘 다 받는다.
export function dateValue(d: Date | string): number {
  return new Date(d).getTime()
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const safe = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), pageCount) : 1
  return { items: items.slice((safe - 1) * size, safe * size), page: safe, pageCount }
}

export function genreCounts(items: { genre: string | null }[]): { genre: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const { genre } of items) if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1)
  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.genre, b.genre))
}

// 입력하는 동안 "이 값으로 저장됩니다"를 미리 보여주기용. 실제 맞추기는 서버 lib가 한다.
export function canonicalGenre(input: string, existing: string[]): string {
  const g = input.trim()
  if (!g) return ''
  return existing.find((e) => e.toLowerCase() === g.toLowerCase()) ?? g
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export function parseListState(params: RawParams, groups: string[], sortKeys: string[], defaultSort: string): ListState {
  const filters: Record<string, string> = {}
  for (const g of groups) {
    const v = first(params[g])
    if (v) filters[g] = v
  }
  const sort = first(params.sort)
  const dir = first(params.dir)
  const page = Number.parseInt(first(params.page) ?? '', 10)
  return {
    q: first(params.q) ?? '',
    filters,
    sort: sort && sortKeys.includes(sort) ? sort : defaultSort,
    dir: dir === 'asc' || dir === 'desc' ? dir : 'desc',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function listStateToQuery(state: ListState, defaultSort: string): string {
  const p = new URLSearchParams()
  if (state.q.trim()) p.set('q', state.q.trim())
  for (const [g, id] of Object.entries(state.filters)) if (id) p.set(g, id)
  if (state.sort !== defaultSort || state.dir !== 'desc') {
    p.set('sort', state.sort)
    p.set('dir', state.dir)
  }
  if (state.page > 1) p.set('page', String(state.page))
  return p.toString()
}
