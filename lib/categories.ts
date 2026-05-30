import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'content/categories.json')

function readCategories(): string[] {
  if (!fs.existsSync(FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeCategories(categories: string[]): void {
  fs.writeFileSync(FILE, JSON.stringify(categories, null, 2), 'utf-8')
}

export function getCategories(): string[] {
  return readCategories()
}

export function addCategory(name: string): string[] {
  const categories = readCategories()
  const trimmed = name.trim()
  if (trimmed && !categories.includes(trimmed)) {
    categories.push(trimmed)
    writeCategories(categories)
  }
  return categories
}

export function deleteCategory(name: string): string[] {
  const categories = readCategories().filter((c) => c !== name)
  writeCategories(categories)
  return categories
}
