import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { GET } from '../route'
import { PHOTO_DIR } from '@/lib/place-photos'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))

const FILE = 'maps-1.png'
beforeAll(() => {
  fs.mkdirSync(PHOTO_DIR, { recursive: true })
  fs.writeFileSync(path.join(PHOTO_DIR, FILE), 'png-bytes')
})
afterAll(() => fs.rmSync(path.join(PHOTO_DIR, FILE), { force: true }))

const get = (file: string) => GET(new NextRequest(`http://localhost/api/places/photo/${file}`), { params: Promise.resolve({ file }) })

describe('GET /api/places/photo/[file]', () => {
  it('로그인하면 사진을 준다', async () => {
    const res = await get(FILE)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toContain('private')
  })

  it('로그인 안 하면 401', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    expect((await get(FILE)).status).toBe(401)
  })

  it('업로드가 만든 이름이 아니면 404 (경로 조작 차단)', async () => {
    expect((await get('../auth.json')).status).toBe(404)
    expect((await get('maps-1.html')).status).toBe(404)
    expect((await get('maps-999.png')).status).toBe(404)
  })
})
