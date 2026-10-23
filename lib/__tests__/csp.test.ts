import { describe, it, expect } from 'vitest'
import { buildCsp, makeNonce } from '@/lib/csp'

describe('CSP', () => {
  it('nonce와 strict-dynamic으로만 스크립트를 허용하고 unsafe-*는 넣지 않는다', () => {
    const csp = buildCsp('abc123')
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'")
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).not.toContain('unsafe-eval')
  })

  it('프레임 삽입·플러그인·base·폼 전송 제한을 유지한다', () => {
    const csp = buildCsp('n')
    for (const d of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(csp).toContain(d)
    }
  })

  it('nonce는 호출마다 다르고 CSP에 넣을 수 있는 글자(base64)다', () => {
    const a = makeNonce()
    const b = makeNonce()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/)
  })
})
