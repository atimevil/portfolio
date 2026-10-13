import { prisma } from '@/lib/prisma'
import type { Book } from '@prisma/client'

export type BookStatus = 'reading' | 'done' | 'want'

export type BookInput = {
  title: string
  author: string
  genre?: string | null
  status?: BookStatus
  rating?: number | null
  memo?: string | null
}

export async function getAllBooks(): Promise<Book[]> {
  return prisma.book.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
}

export async function createBook(data: BookInput): Promise<Book> {
  return prisma.book.create({ data: await withCanonicalGenre(normalize(data)) })
}

export async function updateBook(id: number, data: Partial<BookInput>): Promise<Book> {
  return prisma.book.update({ where: { id }, data: await withCanonicalGenre(normalize(data)) })
}

export async function deleteBook(id: number): Promise<void> {
  await prisma.book.delete({ where: { id } })
}

export type BookBulkSet = { genre?: string | null; status?: BookStatus }

// 상태를 '다 읽음' 밖으로 바꿔도 별점은 지우지 않는다 — 공개 목록은 done일 때만 별점을 보여주고,
// 실수로 바꿨다 되돌릴 때 별점이 살아 있어야 한다.
export async function updateBooks(ids: number[], set: BookBulkSet): Promise<number> {
  const data = await withCanonicalGenre(normalize(set))
  const { count } = await prisma.book.updateMany({ where: { id: { in: ids } }, data })
  return count
}

export async function deleteBooks(ids: number[]): Promise<number> {
  const { count } = await prisma.book.deleteMany({ where: { id: { in: ids } } })
  return count
}

// 빈 문자열은 null로 저장한다 (Place의 normalize()와 동일한 규칙).
function normalize<T extends Partial<BookInput>>(data: T): T {
  const out = { ...data }
  for (const key of ['genre', 'memo'] as const) {
    if (key in out && typeof out[key] === 'string' && !(out[key] as string).trim()) {
      ;(out as Record<string, unknown>)[key] = null
    }
  }
  return out
}

// 장르를 기존 값의 대소문자에 맞춘다 (lib/music.ts와 같은 규칙).
async function withCanonicalGenre<T extends { genre?: string | null }>(data: T): Promise<T> {
  if (typeof data.genre !== 'string') return data
  const genre = data.genre.trim()
  const hit = await prisma.book.findFirst({
    where: { genre: { equals: genre, mode: 'insensitive' } },
    select: { genre: true },
    orderBy: { id: 'asc' },
  })
  return { ...data, genre: hit?.genre ?? genre }
}
