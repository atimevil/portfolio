import fs from 'fs'
import path from 'path'
import type { PortfolioItem } from '@/types'

const FILE = path.join(process.cwd(), 'content/items.json')

function read(): PortfolioItem[] {
  if (!fs.existsSync(FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8')) as PortfolioItem[]
  } catch {
    return []
  }
}

function write(data: PortfolioItem[]): void {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// 관리자 화면 전용(대시보드·이력관리·items API). 최신 시점(year)이 위로 오도록 desc 정렬.
// 공개 about은 getTimeline()/getProjects()를 따로 쓰므로 영향 없음.
export function getItems(): PortfolioItem[] {
  return read().sort((a, b) => timeKey(b.year) - timeKey(a.year))
}

/** "2025" 또는 "2025.03"/"2025-3" 형태의 시점을 정렬용 숫자(연*100+월)로 변환. 월 없으면 0 */
export function timeKey(value: string): number {
  const m = value.match(/(\d{4})(?:[.\-/]\s*(\d{1,2}))?/)
  if (!m) return 0
  return parseInt(m[1], 10) * 100 + (m[2] ? parseInt(m[2], 10) : 0)
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
 * /about과 상세의 이전·다음이 같은 차례를 쓰도록 한 곳에서 정한다.
 * 케이스 스터디가 채워진 것이 앞(손으로 고른 order), 나머지는 최신순.
 */
export function getOrderedProjects(hasCase: (i: PortfolioItem) => boolean): PortfolioItem[] {
  const all = getProjects()
  return [
    ...all.filter(hasCase),
    ...all.filter((i) => !hasCase(i)).sort((a, b) => timeKey(b.year) - timeKey(a.year)),
  ]
}

/** 전체 항목, 시점 desc 정렬 (타임라인용) */
export function getTimeline(): PortfolioItem[] {
  return read().sort((a, b) => timeKey(b.year) - timeKey(a.year))
}

export function createItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
  const data = read()
  const newItem: PortfolioItem = { ...item, id: Date.now().toString() }
  write([...data, newItem])
  return newItem
}

export function updateItem(id: string, updates: Partial<PortfolioItem>): void {
  const data = read()
  const idx = data.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error(`Item not found: ${id}`)
  data[idx] = { ...data[idx], ...updates }
  write(data)
}

export function deleteItem(id: string): void {
  write(read().filter((i) => i.id !== id))
}
