import books from './data-books.json'
import { prisma } from '../lib/prisma'
import { createBook, type BookInput } from '../lib/books'

// Notion Reading List를 옮긴 일회성 임포트. 같은 제목이 이미 있으면 건너뛰어 여러 번 돌려도 안전하다.
async function main() {
  const have = new Set((await prisma.book.findMany({ select: { title: true } })).map((b) => b.title))
  let added = 0
  for (const b of books as BookInput[]) {
    if (have.has(b.title)) continue
    await createBook(b)
    added++
  }
  console.log(`added ${added}, skipped ${books.length - added}`)
}

main().finally(() => prisma.$disconnect())
