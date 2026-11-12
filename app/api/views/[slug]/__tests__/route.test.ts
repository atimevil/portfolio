import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const getAdminSession = vi.fn()
const incrementViews = vi.fn()
vi.mock('@/lib/session', () => ({ getAdminSession: () => getAdminSession() }))
vi.mock('@/lib/blog', () => ({
  getPostBySlug: async (slug: string) =>
    slug === 'draft' ? { slug, status: 'draft' } : slug === 'missing' ? null : { slug, status: 'published' },
}))
vi.mock('@/lib/views', () => ({
  getViews: () => 7,
  incrementViews: (slug: string) => incrementViews(slug),
}))

import { POST } from '../route'
import { resetViewDedupe } from '@/lib/viewDedupe'

function post(slug: string, ip = '1.2.3.4') {
  const req = new NextRequest(`http://localhost/api/views/${slug}`, { method: 'POST', headers: { 'x-real-ip': ip } })
  return POST(req, { params: Promise.resolve({ slug }) })
}

beforeEach(() => {
  resetViewDedupe()
  getAdminSession.mockReset().mockResolvedValue(null)
  incrementViews.mockReset().mockReturnValue(8)
})

describe('POST /api/views/[slug]', () => {
  it('처음 온 방문자는 센다', async () => {
    expect(await (await post('hello')).json()).toEqual({ views: 8 })
    expect(incrementViews).toHaveBeenCalledTimes(1)
  })

  it('같은 방문자가 반복해 불러도 한 번만 센다', async () => {
    await post('hello')
    for (let i = 0; i < 5; i++) expect(await (await post('hello')).json()).toEqual({ views: 7 })
    expect(incrementViews).toHaveBeenCalledTimes(1)
  })

  it('다른 방문자는 따로 센다', async () => {
    await post('hello', '1.2.3.4')
    await post('hello', '5.6.7.8')
    expect(incrementViews).toHaveBeenCalledTimes(2)
  })

  it('로그인한 관리자의 조회는 세지 않는다', async () => {
    getAdminSession.mockResolvedValue({ user: { name: 'Admin' } })
    expect(await (await post('hello')).json()).toEqual({ views: 7 })
    expect(incrementViews).not.toHaveBeenCalled()
  })

  it('임시 글·없는 글은 404', async () => {
    expect((await post('draft')).status).toBe(404)
    expect((await post('missing')).status).toBe(404)
    expect(incrementViews).not.toHaveBeenCalled()
  })
})
