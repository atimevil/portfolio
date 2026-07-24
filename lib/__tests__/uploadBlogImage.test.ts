import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadBlogImage } from '@/lib/uploadBlogImage'

function pngFile(): File {
  return new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' })
}

afterEach(() => vi.unstubAllGlobals())

describe('uploadBlogImage', () => {
  it('성공하면 서버가 준 url을 반환하고 type=blog로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/blog/blog-1.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = await uploadBlogImage(pngFile())
    expect(url).toBe('/uploads/blog/blog-1.png')

    const [, init] = fetchMock.mock.calls[0]
    const body = init.body as FormData
    expect(body.get('type')).toBe('blog')
    expect(body.get('file')).toBeInstanceOf(File)
  })

  it('응답이 ok가 아니면 throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(uploadBlogImage(pngFile())).rejects.toThrow()
  })

  it('url이 없으면 throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
    await expect(uploadBlogImage(pngFile())).rejects.toThrow()
  })
})
