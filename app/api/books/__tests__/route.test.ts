import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { createBook } from '@/lib/books'
import { GET, POST, PUT, PATCH, DELETE } from '../route'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

// 공개 GET은 설정의 메뉴 노출·개발중 모드를 따른다(lib/publicGate). 실제 settings.json 대신 고정값을 쓴다.
const settings = { devMode: false, navVisibility: { books: true, music: true, gallery: true } }
vi.mock('@/lib/settings', () => ({ getSettings: () => settings }))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

beforeEach(resetDb)
// 공개 GET은 메뉴가 보일 때 세션을 묻지 않아서, 한 테스트에서 걸어둔 mockResolvedValueOnce(null)가
// 소비되지 않고 다음 테스트로 넘어간다. 테스트마다 기본값(관리자)으로 되돌린다.
beforeEach(() => {
  vi.mocked(getServerSession).mockReset().mockResolvedValue({ user: { name: 'admin' } })
})

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

  it('책 메뉴를 꺼 두면 세션 없는 GET은 404, 관리자는 200', async () => {
    settings.navVisibility.books = false
    try {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValueOnce(null)
      expect((await GET()).status).toBe(404)
      expect((await GET()).status).toBe(200)
    } finally {
      settings.navVisibility.books = true
    }
  })
})

function rawRequest(method: string, body: string): NextRequest {
  return new NextRequest('http://localhost/api/books', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

describe('PATCH /api/books (일괄)', () => {
  it('상태를 한 번에 바꾼다', async () => {
    const a = await createBook({ title: 'A', author: 'x' })
    const b = await createBook({ title: 'B', author: 'y' })
    const res = await PATCH(makeRequest('PATCH', { ids: [a.id, b.id], set: { status: 'done' } }))
    expect(await res.json()).toEqual({ count: 2 })
  })

  it.each([
    ['상태 값이 틀림', { ids: [1], set: { status: 'finished' } }],
    ['허용 안 된 칸', { ids: [1], set: { rating: 5 } }],
    ['set 비었음', { ids: [1], set: {} }],
    ['ids 비었음', { ids: [], set: { status: 'done' } }],
  ])('%s → 400', async (_name, body) => {
    expect((await PATCH(makeRequest('PATCH', body))).status).toBe(400)
  })

  it('깨진 JSON → 400', async () => {
    expect((await PATCH(rawRequest('PATCH', '{'))).status).toBe(400)
  })

  it('세션 없으면 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    expect((await PATCH(makeRequest('PATCH', { ids: [1], set: { status: 'done' } }))).status).toBe(401)
  })
})

describe('DELETE /api/books (일괄)', () => {
  it('ids로 지우고 count', async () => {
    const a = await createBook({ title: 'A', author: 'x' })
    const res = await DELETE(makeRequest('DELETE', { ids: [a.id, 999999] }))
    expect(await res.json()).toEqual({ count: 1 })
  })

  it('id 단건은 {ok:true}', async () => {
    const a = await createBook({ title: 'A', author: 'x' })
    expect(await (await DELETE(makeRequest('DELETE', { id: a.id }))).json()).toEqual({ ok: true })
  })

  it('id와 ids 동시 → 400', async () => {
    expect((await DELETE(makeRequest('DELETE', { id: 1, ids: [1] }))).status).toBe(400)
  })
})
