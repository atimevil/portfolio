import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createPost } from '../lib/blog'
import type { BlogPost } from '../types'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')
const CATEGORIES_FILE = path.join(process.cwd(), 'content/categories.json')

export interface ParsedPost {
  file: string
  post: Omit<BlogPost, 'readingTime'> | null
  error?: string
}

export function parseFrontmatter(file: string, raw: string): ParsedPost {
  const { data, content } = matter(raw)
  const slug = file.replace(/\.mdx$/, '')

  if (!data.title) return { file, post: null, error: 'missing title' }
  if (!data.date) return { file, post: null, error: 'missing date' }

  const date = new Date(String(data.date))
  if (Number.isNaN(date.getTime())) {
    return { file, post: null, error: `invalid date: ${data.date}` }
  }

  return {
    file,
    post: {
      slug,
      title: String(data.title),
      date: String(data.date),
      tags: data.tags ?? [],
      category: data.category ?? undefined,
      excerpt: String(data.excerpt ?? content),
      content,
      status: data.status === 'draft' ? 'draft' : 'published',
      contentFormat: 'markdown',
    },
  }
}

async function seedStandaloneCategories(): Promise<void> {
  if (!fs.existsSync(CATEGORIES_FILE)) return
  const { addCategory } = await import('../lib/categories')
  const names: string[] = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'))
  for (const name of names) {
    await addCategory(name)
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
  const parsed = files.map((file) => parseFrontmatter(file, fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')))

  const ok = parsed.filter((p) => p.post)
  const failed = parsed.filter((p) => !p.post)

  console.log(`총 ${files.length}개 파일, 파싱 성공 ${ok.length}개, 실패 ${failed.length}개`)
  failed.forEach((f) => console.log(`  스킵: ${f.file} (${f.error})`))

  if (dryRun) {
    console.log('--dry-run: DB에 쓰지 않음')
    return
  }

  await seedStandaloneCategories()

  let created = 0
  for (const { file, post } of ok) {
    if (!post) continue
    try {
      await createPost(post)
      created++
    } catch (err) {
      console.log(`  실패: ${file} (${(err as Error).message})`)
    }
  }
  console.log(`완료: ${created}/${ok.length}개 생성`)
}

if (require.main === module) {
  main().then(() => process.exit(0))
}
