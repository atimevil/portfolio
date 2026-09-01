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
  return prisma.book.create({ data: normalize(data) })
}

export async function updateBook(id: number, data: Partial<BookInput>): Promise<Book> {
  return prisma.book.update({ where: { id }, data: normalize(data) })
}

export async function deleteBook(id: number): Promise<void> {
  await prisma.book.delete({ where: { id } })
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
