import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
import path from 'path'
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

function pngFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' })
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

  it('type이 없으면 기존 아바타 경로(/uploads/avatar-*)를 유지한다', async () => {
    const res = await POST(makeUploadRequest({ file: pngFile('me.png') }))
    expect(res.status).toBe(200)
    const { url } = await res.json()
    expect(url).toMatch(/^\/uploads\/avatar-\d+\.png$/)
    written.push(path.join(process.cwd(), 'public', url))
  })

  it('파일이 없으면 400', async () => {
    const res = await POST(makeUploadRequest({ type: 'blog' }))
    expect(res.status).toBe(400)
  })
})
