import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resetDb } from '@/lib/__tests__/helpers/resetDb'
import { POST } from '../route'

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
