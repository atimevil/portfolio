import path from 'path'
import { readJsonFile, readJsonFileOr, writeJsonAtomic } from '@/lib/jsonFile'
import type { PortfolioItem } from '@/types'

const FILE = path.join(process.cwd(), 'content/items.json')

// 화면 표시용 — 파일이 깨져도 페이지는 뜬다(빈 목록)
function read(): PortfolioItem[] {
  return readJsonFileOr<PortfolioItem[]>(FILE, [])
}

// 저장 경로용 — 깨진 파일이면 예외를 올려 빈 목록으로 덮어쓰지 않는다
function readForWrite(): PortfolioItem[] {
  return readJsonFile<PortfolioItem[]>(FILE, [])
}

function write(data: PortfolioItem[]): void {
  writeJsonAtomic(FILE, data)
}

// 관리자 화면 전용(대시보드·이력관리·items API). 최신 시점(year)이 위로 오도록 desc 정렬.
// 공개 about은 getTimeline()/getProjects()를 따로 쓰므로 영향 없음.
export function getItems(): PortfolioItem[] {
  return read().sort((a, b) => timeKey(b.year) - timeKey(a.year))
}

/**
 * 시점 문자열을 정렬용 숫자(연·월·일 → YYYYMMDD)로 바꾼다. 빠진 월·일은 0.
 * "2025", "2025.03", "2026.09.17", "2026.07.30~31"(기간이면 시작일) 모두 받는다.
 * 일까지 보는 이유: 같은 달에 여러 건이면 월만으로는 순서가 정해지지 않는다.
 */
export function timeKey(value: string): number {
  const m = value.match(/(\d{4})(?:[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?)?/)
  if (!m) return 0
  const [, y, mo, d] = m
  return parseInt(y, 10) * 10000 + (mo ? parseInt(mo, 10) : 0) * 100 + (d ? parseInt(d, 10) : 0)
}

/** 상세 페이지에서 쓰는 주소 조각. slug가 없으면 id로 폴백해 링크가 끊기지 않게 한다. */
export function projectSlug(item: PortfolioItem): string {
  return item.slug?.trim() || item.id
}

/** 상세 페이지용 단건 조회. slug와 id 양쪽으로 찾는다(예전 링크 보존). */
export function getProjectBySlug(slug: string): PortfolioItem | undefined {
  return read().find((i) => i.type === 'project' && (i.slug?.trim() === slug || i.id === slug))
}

/** 프로젝트만, order(없으면 시점 desc) 정렬 */
export function getProjects(): PortfolioItem[] {
  return read()
    .filter((i) => i.type === 'project')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || timeKey(b.year) - timeKey(a.year))
}

/**
 * 소개(/about)와 홈이 쓰는 목록 — visible한 것만, 최신순(같은 시점이면 order).
 * 숨긴 프로젝트는 여기 안 나오지만 상세 페이지는 직접 URL로 열린다.
 */
export function getOrderedProjects(): PortfolioItem[] {
  return getProjects()
    .filter((i) => i.visible)
    .sort((a, b) => timeKey(b.year) - timeKey(a.year) || (a.order ?? 0) - (b.order ?? 0))
}

/** 전체 항목, 시점 desc 정렬 (타임라인용) */
export function getTimeline(): PortfolioItem[] {
  return read().sort((a, b) => timeKey(b.year) - timeKey(a.year))
}

// 편집 폼은 비운 칸을 ''로 보낸다. 예전엔 비운 칸을 아예 안 보내서(undefined) 병합할 때
// 기존 값이 그대로 남았다 — 링크·슬러그를 지우고 저장해도 안 지워졌다. ''인 키는 빼서 저장한다.
function dropEmpty<T extends object>(item: T): T {
  return Object.fromEntries(Object.entries(item).filter(([, v]) => v !== '')) as T
}

// 프로젝트에서만 쓰는 칸. 종류를 활동·수상으로 바꿀 때 서버가 지운다 — 폼은 이 칸들을 undefined로 보내서
// (JSON에서 키가 빠진다) 병합하면 옛 값이 남고, 화면에는 지워진 것처럼 보여 새로고침하면 되살아났다.
const PROJECT_ONLY_KEYS = [
  'problem', 'contribution', 'result', 'metrics',
  'problem_en', 'contribution_en', 'result_en', 'metrics_en',
  'highlight', 'role', 'highlight_en', 'role_en',
  'skills', 'github', 'paper', 'slug', 'link', 'thumbnail', 'order', 'visible', 'featured',
] as const

function stripProjectOnly(item: PortfolioItem): PortfolioItem {
  const copy: Record<string, unknown> = { ...item }
  for (const key of PROJECT_ONLY_KEYS) delete copy[key]
  return copy as unknown as PortfolioItem
}

/**
 * slug가 다른 프로젝트의 주소(slug 또는 id)와 겹치는지. 겹치면 상세 페이지가 먼저 찾은 쪽만 열린다.
 * selfId는 수정 중인 항목(자기 자신과는 비교하지 않는다).
 */
export function slugTaken(slug: string | undefined, selfId?: string): boolean {
  const s = slug?.trim()
  if (!s) return false
  return read().some((i) => i.type === 'project' && i.id !== selfId && (projectSlug(i) === s || i.id === s))
}

export function createItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
  const data = readForWrite()
  const newItem: PortfolioItem = dropEmpty({ ...item, id: Date.now().toString() })
  write([...data, newItem])
  return newItem
}

// 없는 id면 false (라우트가 404로 답한다)
export function updateItem(id: string, updates: Partial<PortfolioItem>): boolean {
  const data = readForWrite()
  const idx = data.findIndex((i) => i.id === id)
  if (idx === -1) return false
  const merged = dropEmpty({ ...data[idx], ...updates })
  // 원래 프로젝트였던 항목이 다른 종류로 바뀔 때만 지운다(원래 수상인 항목의 지표 등은 그대로 둔다)
  data[idx] = data[idx].type === 'project' && merged.type !== 'project' ? stripProjectOnly(merged) : merged
  write(data)
  return true
}

export function deleteItem(id: string): void {
  write(readForWrite().filter((i) => i.id !== id))
}
