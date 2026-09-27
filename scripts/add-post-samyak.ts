import fs from 'fs'
import path from 'path'
import { createPost } from '../lib/blog'
import { prisma } from '../lib/prisma'

// Notion "삶약"(생명과 약) 강의노트를 옮기는 일회성 스크립트. 실행 후 지운다.
const content = fs.readFileSync(path.join(__dirname, 'data-samyak-post.md'), 'utf-8')

async function main() {
  const slug = await createPost({
    title: '생명과 약 강의노트',
    date: '2025-09-04',
    tags: ['생명과학', '약리학'],
    category: 'Study',
    excerpt: '한 학기 동안 들은 교양 수업 "생명과 약" 노트를 그대로 옮긴다. 약의 작용 원리부터 질환별 치료제까지 14주치 내용.',
    content,
    status: 'draft',
    contentFormat: 'markdown',
  })
  console.log(`created: ${slug}`)
}

main().finally(() => prisma.$disconnect())
