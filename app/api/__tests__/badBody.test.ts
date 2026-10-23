import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: 'admin' } }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// 깨진 JSON이나 객체가 아닌 본문은 500이 아니라 400으로 답해야 한다(인증된 요청만 여기까지 온다).
const ROUTES: Array<[string, string, string[]]> = [
  ['items', '../items/route', ['POST', 'PUT', 'DELETE']],
  ['music', '../music/route', ['POST', 'PUT']],
  ['books', '../books/route', ['POST', 'PUT']],
  ['places', '../places/route', ['POST', 'PUT', 'DELETE']],
  ['blog', '../blog/route', ['POST', 'PUT', 'DELETE']],
  ['categories', '../categories/route', ['POST', 'DELETE']],
  ['gallery', '../gallery/route', ['DELETE']],
  ['password', '../password/route', ['POST']],
  ['settings', '../settings/route', ['PUT']],
]

const BODIES: Array<[string, string]> = [
  ['깨진 JSON', '{bad'],
  ['null', 'null'],
  ['배열', '[1]'],
]

describe.each(ROUTES)('/api/%s 본문 검사', (name, mod, methods) => {
  for (const method of methods) {
    for (const [label, raw] of BODIES) {
      it(`${method}에 ${label}를 보내면 400`, async () => {
        const handler = (await import(/* @vite-ignore */ mod))[method] as (r: NextRequest) => Promise<Response>
        const req = new NextRequest(`http://localhost/api/${name}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: raw,
        })
        const res = await handler(req)
        expect(res.status).toBe(400)
      })
    }
  }
})
