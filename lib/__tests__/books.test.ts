import { describe, it, expect, beforeEach } from 'vitest'
import { getAllBooks, createBook, updateBook, deleteBook, updateBooks, deleteBooks } from '@/lib/books'
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

describe('장르 대소문자 맞추기 (책)', () => {
  it('기존 장르와 대소문자만 다르면 기존 값으로 저장한다', async () => {
    await createBook({ title: 'A', author: 'x', genre: 'Essay' })
    const b = await createBook({ title: 'B', author: 'y', genre: 'essay' })
    expect(b.genre).toBe('Essay')
    expect((await updateBook(b.id, { genre: ' ESSAY ' })).genre).toBe('Essay')
  })
})

describe('updateBooks / deleteBooks', () => {
  it('상태를 한 번에 바꾸고 별점은 지우지 않는다', async () => {
    const a = await createBook({ title: 'A', author: 'x', status: 'done', rating: 4 })
    const b = await createBook({ title: 'B', author: 'y', status: 'want' })
    expect(await updateBooks([a.id, b.id], { status: 'reading' })).toBe(2)
    const all = await getAllBooks()
    expect(all.every((x) => x.status === 'reading')).toBe(true)
    expect(all.find((x) => x.id === a.id)?.rating).toBe(4)
  })

  it('장르를 한 번에 바꾸고, 없는 id는 세지 않는다', async () => {
    const a = await createBook({ title: 'A', author: 'x' })
    expect(await updateBooks([a.id, 999999], { genre: '소설' })).toBe(1)
    expect(await deleteBooks([a.id, 999999])).toBe(1)
  })
})

describe('장르 대소문자 맞추기 (책) — 특수 문자', () => {
  it('% 와 _ 는 와일드카드가 아니라 글자 그대로 비교한다', async () => {
    await createBook({ title: 'A', author: 'x', genre: 'Lo-fi' })
    expect((await createBook({ title: 'B', author: 'y', genre: 'Lo_fi' })).genre).toBe('Lo_fi')
    expect((await createBook({ title: 'C', author: 'z', genre: '%' })).genre).toBe('%')
  })
})
