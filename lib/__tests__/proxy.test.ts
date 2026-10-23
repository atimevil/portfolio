import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const getToken = vi.fn()
vi.mock('next-auth/jwt', () => ({ getToken: (...a: unknown[]) => getToken(...a) }))

import { proxy } from '../../proxy'

const req = (path: string) => new NextRequest(`http://localhost${path}`)

beforeEach(() => getToken.mockReset().mockResolvedValue(null))

describe('proxy', () => {
  it('공개 페이지는 로그인 없이 통과하고 nonce CSP를 받는다', async () => {
    for (const path of ['/', '/about', '/blog', '/work/not-yet', '/gallery']) {
      const res = await proxy(req(path))
      expect(res.status, path).toBe(200)
      expect(res.headers.get('location'), path).toBeNull()
      expect(res.headers.get('content-security-policy'), path).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/)
    }
  })

  it('요청마다 다른 nonce를 쓴다', async () => {
    const a = (await proxy(req('/'))).headers.get('content-security-policy')
    const b = (await proxy(req('/'))).headers.get('content-security-policy')
    expect(a).not.toBe(b)
  })

  it('/admin과 /maps는 로그인이 없으면 로그인 페이지로 보낸다', async () => {
    for (const path of ['/admin', '/admin/items', '/maps']) {
      const res = await proxy(req(path))
      expect(res.status, path).toBe(307)
      expect(new URL(res.headers.get('location')!).pathname, path).toBe('/admin/login')
    }
  })

  it('로그인 페이지는 로그인 전엔 열리고 로그인 후엔 대시보드로 보낸다', async () => {
    expect((await proxy(req('/admin/login'))).status).toBe(200)
    getToken.mockResolvedValue({ name: 'admin' })
    const res = await proxy(req('/admin/login'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin')
  })

  it('로그인했으면 /admin은 통과한다', async () => {
    getToken.mockResolvedValue({ name: 'admin' })
    expect((await proxy(req('/admin/items'))).status).toBe(200)
  })

  it('/en은 로그인 없이 통과하고 x-locale을 넘긴다', async () => {
    const res = await proxy(req('/en/about'))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-request-x-locale')).toBe('en')
  })
})
