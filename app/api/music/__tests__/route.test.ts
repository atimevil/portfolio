import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { createTrack } from '@/lib/music'
import { GET, POST, PUT, DELETE } from '../route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

beforeEach(resetDb)

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
