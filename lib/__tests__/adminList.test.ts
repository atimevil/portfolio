import { describe, it, expect } from 'vitest'
import {
  normalizeQuery, matchesQuery, applyFilters, sortItems, dateValue, paginate,
  genreCounts, canonicalGenre, parseListState, listStateToQuery, visibleSelection, type FilterDef,
} from '@/lib/adminList'

describe('검색', () => {
  it('대소문자·연속 공백·앞뒤 공백을 무시한다', () => {
    expect(normalizeQuery('  Death   BED ')).toBe('death bed')
    expect(matchesQuery(['Death Bed', 'Powfu'], 'death  bed')).toBe(true)
  })
  it('한글과 메모 칸도 찾는다', () => {
    expect(matchesQuery(['Girl', 'Alexander 23', '비 오는 날 듣기'], '비 오는')).toBe(true)
  })
  it('null 칸은 건너뛰고, 빈 검색어는 모두 통과', () => {
    expect(matchesQuery([null, 'x'], 'y')).toBe(false)
    expect(matchesQuery([null], '   ')).toBe(true)
  })
})

type Row = { id: number; genre: string | null; favorite: boolean }
const rows: Row[] = [
  { id: 1, genre: 'Pop', favorite: true },
  { id: 2, genre: 'Pop', favorite: false },
  { id: 3, genre: null, favorite: true },
]
const defs: FilterDef<Row>[] = [
  { group: 'flag', id: 'favorite', label: '즐겨찾기', test: (r) => r.favorite },
  { group: 'flag', id: 'nogenre', label: '장르 없음', test: (r) => !r.genre },
  { group: 'genre', id: 'Pop', label: 'Pop', test: (r) => r.genre === 'Pop' },
]

describe('필터', () => {
  it('그룹끼리는 AND', () => {
    expect(applyFilters(rows, defs, { flag: 'favorite', genre: 'Pop' }).map((r) => r.id)).toEqual([1])
  })
  it('없는 필터 id는 무시한다(주소에 이상한 값)', () => {
    expect(applyFilters(rows, defs, { genre: '없는장르' })).toHaveLength(3)
  })
})

describe('정렬', () => {
  const items = [{ v: '나' }, { v: null }, { v: '가' }, { v: 'b' }, { v: 'A' }]
  it('오름차순, 빈 값은 맨 뒤', () => {
    expect(sortItems(items, (i) => i.v, 'asc').map((i) => i.v)).toEqual(['가', '나', 'A', 'b', null])
  })
  it('내림차순에서도 빈 값은 맨 뒤', () => {
    expect(sortItems(items, (i) => i.v, 'desc').map((i) => i.v)).toEqual(['b', 'A', '나', '가', null])
  })
  it('원본 배열을 바꾸지 않는다', () => {
    const copy = [...items]
    sortItems(items, (i) => i.v, 'asc')
    expect(items).toEqual(copy)
  })
  it('Date와 문자열 날짜가 섞여도 날짜 순서로 정렬한다', () => {
    const mixed = [
      { at: '2026-10-02T00:00:00.000Z' as Date | string },
      { at: new Date('2026-10-03T00:00:00.000Z') },
      { at: '2026-10-01T00:00:00.000Z' },
    ]
    const out = sortItems(mixed, (i) => dateValue(i.at), 'desc')
    expect(out.map((i) => new Date(i.at).getUTCDate())).toEqual([3, 2, 1])
  })
})

describe('쪽 나누기', () => {
  const list = Array.from({ length: 120 }, (_, i) => i)
  it('50개씩 자른다', () => {
    expect(paginate(list, 1)).toMatchObject({ page: 1, pageCount: 3 })
    expect(paginate(list, 3).items).toEqual(list.slice(100))
  })
  it('범위를 넘으면 마지막 쪽, 0 이하·NaN이면 1쪽', () => {
    expect(paginate(list, 999).page).toBe(3)
    expect(paginate(list, 0).page).toBe(1)
    expect(paginate(list, Number.NaN).page).toBe(1)
  })
  it('빈 목록은 1쪽/1쪽', () => {
    expect(paginate([], 5)).toEqual({ items: [], page: 1, pageCount: 1 })
  })
})

describe('장르', () => {
  it('많이 쓴 순서로 세고, 같으면 이름순, 빈 장르는 빼고 센다', () => {
    const g = genreCounts([{ genre: 'Pop' }, { genre: 'J-Pop' }, { genre: 'Pop' }, { genre: null }, { genre: 'Hip Hop' }])
    expect(g).toEqual([
      { genre: 'Pop', count: 2 },
      { genre: 'Hip Hop', count: 1 },
      { genre: 'J-Pop', count: 1 },
    ])
  })
  it('canonicalGenre: 대소문자만 다르면 기존 값, 아니면 공백만 정리', () => {
    expect(canonicalGenre(' hip hop ', ['Pop', 'Hip Hop'])).toBe('Hip Hop')
    expect(canonicalGenre(' City Pop ', ['Pop'])).toBe('City Pop')
    expect(canonicalGenre('   ', ['Pop'])).toBe('')
  })
})

describe('주소 상태', () => {
  const groups = ['flag', 'genre']
  const keys = ['title', 'createdAt']
  it('읽고 다시 쓰면 같은 값', () => {
    const s = parseListState({ q: 'death', genre: 'Hip Hop', sort: 'title', dir: 'asc', page: '2' }, groups, keys, 'createdAt')
    expect(s).toEqual({ q: 'death', filters: { genre: 'Hip Hop' }, sort: 'title', dir: 'asc', page: 2 })
    expect(listStateToQuery(s, 'createdAt')).toBe('q=death&genre=Hip+Hop&sort=title&dir=asc&page=2')
  })
  it('이상한 값은 기본값으로', () => {
    const s = parseListState({ page: 'abc', dir: 'sideways', sort: 'drop table', q: ['a', 'b'], other: 'x' }, groups, keys, 'createdAt')
    expect(s).toEqual({ q: 'a', filters: {}, sort: 'createdAt', dir: 'desc', page: 1 })
  })
  it('기본값은 주소에 쓰지 않는다', () => {
    expect(listStateToQuery({ q: '', filters: {}, sort: 'createdAt', dir: 'desc', page: 1 }, 'createdAt')).toBe('')
  })
})

describe('visibleSelection', () => {
  it('지금 걸러진 목록에 남아 있는 선택만 돌려준다(패널에서 고쳐 필터에서 빠진 항목은 제외)', () => {
    const filtered = [{ id: 1 }, { id: 3 }]
    expect(visibleSelection(new Set([1, 2, 3]), filtered)).toEqual([1, 3])
  })
  it('걸러진 목록 순서와 상관없이 선택한 순서를 유지한다', () => {
    expect(visibleSelection(new Set([3, 1]), [{ id: 1 }, { id: 3 }])).toEqual([3, 1])
  })
})
