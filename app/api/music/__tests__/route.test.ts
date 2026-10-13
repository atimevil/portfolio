import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { createTrack } from '@/lib/music'
import { GET, POST, PUT, PATCH, DELETE } from '../route'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

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
  return new NextRequest('http://localhost/api/music', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/music', () => {
  it('등록된 트랙 목록을 반환한다', async () => {
    await createTrack({ title: 'T', artist: 'A' })
    const res = await GET()
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].title).toBe('T')
  })
})

describe('POST /api/music', () => {
  it('제목/아티스트만으로 201과 함께 생성된다', async () => {
    const res = await POST(makeRequest('POST', { title: 'T', artist: 'A' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.title).toBe('T')
  })

  it('title이 없으면 400', async () => {
    const res = await POST(makeRequest('POST', { artist: 'A' }))
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/music', () => {
  it('id로 장르/링크를 수정한다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    const res = await PUT(makeRequest('PUT', { id: track.id, genre: '락', link: 'https://x' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.genre).toBe('락')
  })

  it('id가 없으면 400', async () => {
    const res = await PUT(makeRequest('PUT', { genre: '락' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/music', () => {
  it('id로 삭제한다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    const res = await DELETE(makeRequest('DELETE', { id: track.id }))
    expect(res.status).toBe(200)
  })
})

describe('인증', () => {
  it('세션 없이 POST하면 401', async () => {
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await POST(makeRequest('POST', { title: 'T', artist: 'A' }))
    expect(res.status).toBe(401)
  })

  it('세션 없이 GET하면 200 (공개 조회)', async () => {
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(200)
  })
})

function rawRequest(method: string, body: string): NextRequest {
  return new NextRequest('http://localhost/api/music', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

describe('PATCH /api/music (일괄)', () => {
  it('여러 곡의 장르를 바꾸고 count를 돌려준다', async () => {
    const a = await createTrack({ title: 'A', artist: 'x' })
    const b = await createTrack({ title: 'B', artist: 'y' })
    const res = await PATCH(makeRequest('PATCH', { ids: [a.id, b.id, a.id], set: { genre: 'Pop' } }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 2 })
  })

  it('장르 빈 문자열은 장르 없음으로 되돌린다', async () => {
    const a = await createTrack({ title: 'A', artist: 'x', genre: 'Pop' })
    await PATCH(makeRequest('PATCH', { ids: [a.id], set: { genre: '' } }))
    const list = await (await GET()).json()
    expect(list[0].genre).toBeNull()
  })

  it.each([
    ['ids 비었음', { ids: [], set: { favorite: true } }],
    ['ids 501개', { ids: Array.from({ length: 501 }, (_, i) => i + 1), set: { favorite: true } }],
    ['ids 정수 아님', { ids: [1.5], set: { favorite: true } }],
    ['ids 음수', { ids: [-1], set: { favorite: true } }],
    ['set 비었음', { ids: [1], set: {} }],
    ['허용 안 된 칸', { ids: [1], set: { title: 'x' } }],
    ['set 없음', { ids: [1] }],
  ])('%s → 400', async (_name, body) => {
    const res = await PATCH(makeRequest('PATCH', body))
    expect(res.status).toBe(400)
  })

  it('깨진 JSON → 400', async () => {
    const res = await PATCH(rawRequest('PATCH', '{not json'))
    expect(res.status).toBe(400)
  })

  it('세션 없으면 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const res = await PATCH(makeRequest('PATCH', { ids: [1], set: { favorite: true } }))
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/music (일괄)', () => {
  it('ids로 여러 곡을 지우고 count를 돌려준다(없는 id는 세지 않음)', async () => {
    const a = await createTrack({ title: 'A', artist: 'x' })
    const b = await createTrack({ title: 'B', artist: 'y' })
    const res = await DELETE(makeRequest('DELETE', { ids: [a.id, b.id, 999999] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 2 })
  })

  it('id 단건 삭제는 예전처럼 {ok:true}', async () => {
    const a = await createTrack({ title: 'A', artist: 'x' })
    const res = await DELETE(makeRequest('DELETE', { id: a.id }))
    expect(await res.json()).toEqual({ ok: true })
  })

  it('id와 ids를 같이 보내면 400', async () => {
    const res = await DELETE(makeRequest('DELETE', { id: 1, ids: [1] }))
    expect(res.status).toBe(400)
  })

  it('id도 ids도 없으면 400', async () => {
    const res = await DELETE(makeRequest('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('깨진 JSON → 400', async () => {
    const res = await DELETE(rawRequest('DELETE', 'nope'))
    expect(res.status).toBe(400)
  })
})
