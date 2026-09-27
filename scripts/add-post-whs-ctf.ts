import fs from 'fs'
import path from 'path'
import { createPost } from '../lib/blog'
import { prisma } from '../lib/prisma'

// Notion "WHS_writeup" 글을 옮기는 일회성 스크립트. 실행 후 지운다.
const content = fs.readFileSync(path.join(__dirname, 'data-whs-ctf-post.md'), 'utf-8')

async function main() {
  const slug = await createPost({
    title: 'WHS CTF Writeup',
    date: '2025-09-04',
    tags: ['CTF', 'Security'],
    category: 'Security',
    excerpt: 'WHS 과정에서 푼 CTF 문제 두 개 복기. 리다이렉트 필터 우회와 한글 초성·중성·종성 회전 암호 브루트포스.',
    content,
    status: 'draft',
    contentFormat: 'markdown',
  })
  console.log(`created: ${slug}`)
}

main().finally(() => prisma.$disconnect())
