import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadMusicCover } from '@/lib/uploadMusicCover'

function pngFile(): File {
  return new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' })
}

afterEach(() => vi.unstubAllGlobals())

describe('uploadMusicCover', () => {
  it('성공하면 서버가 준 url을 반환하고 type=music으로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/music/music-1.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = await uploadMusicCover(pngFile())
    expect(url).toBe('/uploads/music/music-1.png')

    const [, options] = fetchMock.mock.calls[0]
    const form = options.body as FormData
    expect(form.get('type')).toBe('music')
  })

  it('업로드 실패하면 에러를 던진다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(uploadMusicCover(pngFile())).rejects.toThrow('이미지 업로드에 실패했습니다.')
  })
})
