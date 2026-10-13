import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendBulk, errorMessage } from '@/lib/adminFetch'

afterEach(() => vi.unstubAllGlobals())

describe('errorMessage', () => {
  it('상태 코드별 문구', () => {
    expect(errorMessage(401)).toBe('로그인이 만료됐습니다. 다시 로그인해 주세요.')
    expect(errorMessage(400)).toBe('요청이 올바르지 않습니다.')
    expect(errorMessage(500)).toBe('오류 500')
  })
})

describe('sendBulk', () => {
  it('성공하면 count를 돌려준다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: 3 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendBulk('/api/music', 'PATCH', { ids: [1] })).toBe(3)
    expect(fetchMock).toHaveBeenCalledWith('/api/music', expect.objectContaining({ method: 'PATCH' }))
  })
  it('실패 응답은 문구를 담은 Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    await expect(sendBulk('/api/music', 'DELETE', { ids: [1] })).rejects.toThrow('로그인이 만료됐습니다')
  })
  it('네트워크 오류도 문구를 담은 Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(sendBulk('/api/music', 'DELETE', { ids: [1] })).rejects.toThrow('네트워크')
  })
})
