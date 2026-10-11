import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { stripImageMetadata } from '@/lib/stripMetadata'

const base = () => sharp({ create: { width: 40, height: 20, channels: 3, background: '#c33' } })

describe('stripImageMetadata', () => {
  it('JPEG의 GPS·EXIF를 지우고, 회전값은 픽셀에 반영한다', async () => {
    const withGps = await base()
      .withExif({ IFD0: { Copyright: 'me' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '35/1 9/1 0/1' } })
      .withMetadata({ orientation: 6 }) // 90도 돌려서 보라는 표시(휴대폰 세로 사진)
      .jpeg()
      .toBuffer()
    const before = await sharp(withGps).metadata()
    expect(before.exif).toBeDefined()

    const after = await sharp(await stripImageMetadata(withGps)).metadata()
    expect(after.exif).toBeUndefined()
    expect(after.orientation).toBeUndefined()
    expect([after.width, after.height]).toEqual([20, 40])
  })

  it('PNG 메타데이터도 지운다', async () => {
    const png = await base().withExif({ IFD0: { Copyright: 'me' } }).png().toBuffer()
    expect((await sharp(await stripImageMetadata(png)).metadata()).exif).toBeUndefined()
  })

  it('메타데이터가 없으면 다시 인코딩하지 않는다', async () => {
    const clean = await base().jpeg().toBuffer()
    expect(await stripImageMetadata(clean)).toBe(clean)
  })

  it('이미지가 아니면 그대로 돌려준다', async () => {
    const junk = Buffer.from([1, 2, 3])
    expect(await stripImageMetadata(junk)).toBe(junk)
  })
})
