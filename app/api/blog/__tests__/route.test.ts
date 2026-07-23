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
  it('같은 slug로 두 번 생성하면 두 번째는 409로 거부한다', async () => {
    const basePost = {
      slug: 'dup-slug',
      title: 'First',
      date: '2024-01-01',
      tags: [],
      excerpt: 'first excerpt',
      content: 'first content',
      status: 'draft' as const,
    }

    const firstRes = await POST(makePostRequest(basePost))
    expect(firstRes.status).toBe(201)

    const secondRes = await POST(
      makePostRequest({ ...basePost, title: 'Second', content: 'second content' })
    )
    expect(secondRes.status).toBe(409)
    const secondBody = await secondRes.json()
    expect(secondBody).toHaveProperty('error')
  })
})
