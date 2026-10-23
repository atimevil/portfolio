import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))
const updateSettings = vi.fn((u: unknown) => u)
vi.mock('@/lib/settings', () => ({ getSettings: () => ({}), updateSettings: (u: unknown) => updateSettings(u) }))

import { PUT } from '../route'

beforeEach(() => updateSettings.mockClear())

const put = (body: unknown) =>
  PUT(new NextRequest('http://localhost/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

describe('PUT /api/settings', () => {
  it('알려진 칸만 저장하고 모르는 키는 버린다', async () => {
    const res = await put({ devMode: true, evil: 'x', profile: { name: 'N', injected: 1 } })
    expect(res.status).toBe(200)
    expect(updateSettings).toHaveBeenCalledWith({ devMode: true, profile: { name: 'N' } })
  })

  it('칸의 타입이 틀리면 400', async () => {
    for (const body of [{ devMode: 'yes' }, { profile: { skills: 'a,b' } }, { navVisibility: { music: 1 } }]) {
      expect((await put(body)).status).toBe(400)
    }
    expect(updateSettings).not.toHaveBeenCalled()
  })
})
