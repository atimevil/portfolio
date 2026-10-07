import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { makeThumbnail } from '@/lib/gallery'

const id = `test-thumb-${process.pid}`
const file = path.join(process.cwd(), 'public/uploads/gallery/thumbs', `${id}.webp`)

afterAll(() => fs.rmSync(file, { force: true }))

describe('makeThumbnail', () => {
  it('세로로 긴 이미지도 짧은 변을 600px로 맞춘 webp를 만든다', async () => {
    const tall = await sharp({ create: { width: 1200, height: 3600, channels: 3, background: '#888' } }).png().toBuffer()
    expect(await makeThumbnail(tall, id)).toBe(`thumbs/${id}.webp`)
    const meta = await sharp(file).metadata()
    expect(meta.format).toBe('webp')
    expect([meta.width, meta.height]).toEqual([600, 1800])
  })
})
