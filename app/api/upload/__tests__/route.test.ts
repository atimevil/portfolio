import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { POST } from '../route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

function makeUploadRequest(fields: { file?: File; type?: string }): NextRequest {
  const form = new FormData()
  if (fields.file) form.append('file', fields.file)
  if (fields.type) form.append('type', fields.type)
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: form })
}

// 저장 형식을 파일 내용으로 판별하므로 진짜 PNG여야 한다
let PNG: Buffer
beforeAll(async () => {
  PNG = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } }).png().toBuffer()
})
function pngFile(name: string): File {
  return new File([new Uint8Array(PNG)], name, { type: 'image/png' })
}

const written: string[] = []
afterEach(async () => {
  for (const p of written.splice(0)) {
    if (existsSync(p)) await unlink(p)
  }
})

describe('POST /api/upload', () => {
  it('type=blog면 /uploads/blog/ 아래에 저장하고 그 URL을 반환한다', async () => {
    const res = await POST(makeUploadRequest({ file: pngFile('shot.png'), type: 'blog' }))
    expect(res.status).toBe(200)
    const { url } = await res.json()
    expect(url).toMatch(/^\/uploads\/blog\/blog-\d+\.png$/)
    const abs = path.join(process.cwd(), 'public', url)
    written.push(abs)
    expect(existsSync(abs)).toBe(true)
  })

  it('type=music이면 /uploads/music/ 아래에 저장하고 그 URL을 반환한다', async () => {
    const res = await POST(makeUploadRequest({ file: pngFile('cover.png'), type: 'music' }))
    expect(res.status).toBe(200)
    const { url } = await res.json()
    expect(url).toMatch(/^\/uploads\/music\/music-\d+\.png$/)
    const abs = path.join(process.cwd(), 'public', url)
    written.push(abs)
    expect(existsSync(abs)).toBe(true)
  })

  it('type이 없으면 기존 아바타 경로(/uploads/avatar-*)를 유지한다', async () => {
    const res = await POST(makeUploadRequest({ file: pngFile('me.png') }))
    expect(res.status).toBe(200)
    const { url } = await res.json()
    expect(url).toMatch(/^\/uploads\/avatar-\d+\.png$/)
    written.push(path.join(process.cwd(), 'public', url))
  })

  it('이미지로 위장한 HTML은 저장하지 않는다', async () => {
    const fake = new File(['<script>alert(1)</script>'], 'x.png', { type: 'image/png' })
    const res = await POST(makeUploadRequest({ file: fake, type: 'blog' }))
    expect(res.status).toBe(400)
  })

  it('파일 이름의 확장자가 아니라 실제 형식으로 저장한다', async () => {
    const res = await POST(makeUploadRequest({ file: pngFile('shot.html'), type: 'blog' }))
    const { url } = await res.json()
    expect(url).toMatch(/\.png$/)
    written.push(path.join(process.cwd(), 'public', url))
  })

  it('파일이 없으면 400', async () => {
    const res = await POST(makeUploadRequest({ type: 'blog' }))
    expect(res.status).toBe(400)
  })
})
