import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { detectImageExt } from '@/lib/imageExt'

const px = () => sharp({ create: { width: 4, height: 4, channels: 3, background: '#808080' } })

describe('detectImageExt', () => {
  it('실제 이미지 형식으로 확장자를 정한다', async () => {
    expect(await detectImageExt(await px().jpeg().toBuffer())).toBe('jpg')
    expect(await detectImageExt(await px().png().toBuffer())).toBe('png')
    expect(await detectImageExt(await px().webp().toBuffer())).toBe('webp')
    expect(await detectImageExt(await px().gif().toBuffer())).toBe('gif')
  })

  it('HTML·SVG처럼 브라우저가 문서로 여는 파일은 거부한다', async () => {
    expect(await detectImageExt(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull()
    expect(await detectImageExt(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><script>alert(1)</script></svg>'))).toBeNull()
  })
})
