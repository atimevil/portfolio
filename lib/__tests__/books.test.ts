import { describe, it, expect, beforeEach } from 'vitest'
import { getAllBooks, createBook, updateBook, deleteBook } from '@/lib/books'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('createBook + getAllBooks', () => {
  it('책을 저장하고 최신순으로 읽어온다', async () => {
    await createBook({ title: '먼저 등록', author: 'A' })
    await createBook({ title: '나중 등록', author: 'B' })

    const books = await getAllBooks()
    expect(books.map((b) => b.title)).toEqual(['나중 등록', '먼저 등록'])
  })

  it('status 기본값은 want다', async () => {
    const book = await createBook({ title: 'T', author: 'A' })
    expect(book.status).toBe('want')
  })

  it('빈 문자열 genre/memo는 null로 저장된다', async () => {
    const book = await createBook({ title: 'T', author: 'A', genre: '', memo: '' })
    expect(book.genre).toBeNull()
    expect(book.memo).toBeNull()
  })
})

describe('updateBook', () => {
  it('상태를 reading에서 done으로 바꾸고 별점을 매길 수 있다', async () => {
    const book = await createBook({ title: 'T', author: 'A', status: 'reading' })
    const updated = await updateBook(book.id, { status: 'done', rating: 5 })
    expect(updated.status).toBe('done')
    expect(updated.rating).toBe(5)
  })
})

describe('deleteBook', () => {
  it('삭제 후에는 목록에서 사라진다', async () => {
    const book = await createBook({ title: 'T', author: 'A' })
    await deleteBook(book.id)
    expect(await getAllBooks()).toHaveLength(0)
  })
})
