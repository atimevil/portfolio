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

export function getItems(): PortfolioItem[] {
  return read()
}

/** 프로젝트만, order(없으면 year desc) 정렬 */
export function getProjects(): PortfolioItem[] {
  return read()
    .filter((i) => i.type === 'project')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.year.localeCompare(a.year))
}

/** 전체 항목, 연도 desc 정렬 (타임라인용) */
export function getTimeline(): PortfolioItem[] {
  return read().sort((a, b) => b.year.localeCompare(a.year))
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
