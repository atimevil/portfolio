import path from 'path'
import { readJsonFile, readJsonFileOr, writeJsonAtomic } from '@/lib/jsonFile'

const FILE = path.join(process.cwd(), 'content/views.json')

function readViews(): Record<string, number> {
  return readJsonFileOr<Record<string, number>>(FILE, {})
}

export function getViews(slug: string): number {
  return readViews()[slug] ?? 0
}

export function getAllViews(): Record<string, number> {
  return readViews()
}

export function incrementViews(slug: string): number {
  // 깨진 파일이면 여기서 예외 — 빈 객체에 1을 더해 모든 글의 조회수를 지우지 않는다
  const views = readJsonFile<Record<string, number>>(FILE, {})
  views[slug] = (views[slug] ?? 0) + 1
  writeJsonAtomic(FILE, views)
  return views[slug]
}
