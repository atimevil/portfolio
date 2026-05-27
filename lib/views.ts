import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'content/views.json')

function readViews(): Record<string, number> {
  if (!fs.existsSync(FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export function getViews(slug: string): number {
  return readViews()[slug] ?? 0
}

export function getAllViews(): Record<string, number> {
  return readViews()
}

export function incrementViews(slug: string): number {
  const views = readViews()
  views[slug] = (views[slug] ?? 0) + 1
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(views, null, 2), 'utf-8')
  return views[slug]
}
