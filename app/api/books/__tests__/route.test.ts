import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { createBook } from '@/lib/books'
import { GET, POST, PUT, DELETE } from '../route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

beforeEach(resetDb)

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/books', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/books', () => {
  it('등록된 책 목록을 반환한다', async () => {
    await createBook({ title: 'T', author: 'A' })
    const res = await GET()
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].title).toBe('T')
  })
})

describe('POST /api/books', () => {
  it('제목/저자만으로 201과 함께 생성된다', async () => {
    const res = await POST(makeRequest('POST', { title: 'T', author: 'A' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.title).toBe('T')
    expect(json.status).toBe('want')
  })

  it('title이 없으면 400', async () => {
    const res = await POST(makeRequest('POST', { author: 'A' }))
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/books', () => {
  it('id로 상태/별점을 수정한다', async () => {
    const book = await createBook({ title: 'T', author: 'A' })
    const res = await PUT(makeRequest('PUT', { id: book.id, status: 'done', rating: 4 }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('done')
    expect(json.rating).toBe(4)
  })

  it('id가 없으면 400', async () => {
    const res = await PUT(makeRequest('PUT', { status: 'done' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/books', () => {
  it('id로 삭제한다', async () => {
    const book = await createBook({ title: 'T', author: 'A' })
    const res = await DELETE(makeRequest('DELETE', { id: book.id }))
    expect(res.status).toBe(200)
  })
})

describe('인증', () => {
  it('세션 없이 POST하면 401', async () => {
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await POST(makeRequest('POST', { title: 'T', author: 'A' }))
    expect(res.status).toBe(401)
  })

  it('세션 없이 GET하면 200 (공개 조회)', async () => {
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(200)
  })
})
