import { describe, it, expect, vi, beforeEach } from 'vitest'

const getServerSession = vi.fn()
vi.mock('next-auth', () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth-password', () => ({ passwordVersion: () => 'v-now' }))

import { getAdminSession } from '@/lib/session'

beforeEach(() => getServerSession.mockReset())

describe('getAdminSession', () => {
  it('세션이 없으면 null', async () => {
    getServerSession.mockResolvedValue(null)
    expect(await getAdminSession()).toBeNull()
  })

  it('로그인할 때의 비밀번호 버전이 지금과 같으면 세션을 돌려준다', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'Admin' }, pv: 'v-now' })
    expect(await getAdminSession()).toMatchObject({ user: { name: 'Admin' } })
  })

  it('비밀번호를 바꾸기 전에 만든 세션은 null', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'Admin' }, pv: 'v-old' })
    expect(await getAdminSession()).toBeNull()
  })

  it('버전이 없는 예전 세션도 null', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'Admin' } })
    expect(await getAdminSession()).toBeNull()
  })
})
