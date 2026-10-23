import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { POST, PUT } from '../route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

beforeEach(resetDb)

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/blog', () => {
  it('slug 없이 보내면 제목에서 자동 생성해 201로 응답한다', async () => {
    const res = await POST(
      makePostRequest({
        title: 'Auto Slug Post',
        date: '2024-01-01',
        tags: [],
        excerpt: 'excerpt',
        content: 'content',
        status: 'draft',
      })
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ ok: true, slug: 'auto-slug-post' })
  })

  it('같은 제목으로 두 번 보내도 각각 다른 slug로 둘 다 생성된다', async () => {
    const basePost = {
      title: 'Duplicate Title',
      date: '2024-01-01',
      tags: [],
      excerpt: 'excerpt',
      content: 'content',
      status: 'draft' as const,
    }

    const firstRes = await POST(makePostRequest(basePost))
    expect(firstRes.status).toBe(201)
    expect((await firstRes.json()).slug).toBe('duplicate-title')

    const secondRes = await POST(makePostRequest({ ...basePost, content: 'second content' }))
    expect(secondRes.status).toBe(201)
    expect((await secondRes.json()).slug).toBe('duplicate-title-2')
  })
})

function makePutRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/blog', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/blog', () => {
  const post = { title: 'Edit Me', date: '2024-01-01', tags: [], excerpt: 'e', content: 'c', status: 'draft' as const }

  it('없는 글이면 500이 아니라 404', async () => {
    const res = await PUT(makePutRequest({ originalSlug: 'no-such-post', title: 'X' }))
    expect(res.status).toBe(404)
  })

  it('날짜 형식이 잘못되면 400', async () => {
    await POST(makePostRequest(post))
    const res = await PUT(makePutRequest({ originalSlug: 'edit-me', date: 'not-a-date' }))
    expect(res.status).toBe(400)
  })

  it('글 생성도 날짜 형식이 잘못되면 400', async () => {
    const res = await POST(makePostRequest({ ...post, date: 'not-a-date' }))
    expect(res.status).toBe(400)
  })

  it('필드 타입이 틀리면 400', async () => {
    await POST(makePostRequest(post))
    const res = await PUT(makePutRequest({ originalSlug: 'edit-me', tags: 'a,b' }))
    expect(res.status).toBe(400)
  })

  it('올바른 부분 수정은 200', async () => {
    await POST(makePostRequest(post))
    const res = await PUT(makePutRequest({ originalSlug: 'edit-me', title: 'Edited' }))
    expect(res.status).toBe(200)
  })
})
