import fs from 'fs'
import path from 'path'
import { createPost } from '../lib/blog'
import { prisma } from '../lib/prisma'

// Notion "2025 LLM Safety Challenge 문제 복기" 글을 옮기는 일회성 스크립트. 실행 후 지운다.
const content = fs.readFileSync(path.join(__dirname, 'data-llm-safety-post.md'), 'utf-8')

async function main() {
  const slug = await createPost({
    title: '2025 LLM Safety Challenge 문제 복기',
    date: '2025-12-05',
    tags: ['AI Safety', 'LLM', 'Red Teaming'],
    category: 'AI',
    excerpt:
      '레드티밍 대회에서 만난 14개 문제를 복기한다. 역할 위임, 점진적 구체화, 빈칸 채우기 — 통했던 프레이밍과 막혔던 이유.',
    content,
    status: 'draft',
    contentFormat: 'markdown',
  })
  console.log(`created: ${slug}`)
}

main().finally(() => prisma.$disconnect())
