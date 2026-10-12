import { describe, it, expect } from 'vitest'
import { ipKey } from '@/lib/rate-limit'

describe('ipKey', () => {
  it('IPv4는 그대로, IPv4-mapped는 IPv4로', () => {
    expect(ipKey('1.2.3.4')).toBe('1.2.3.4')
    expect(ipKey('::ffff:1.2.3.4')).toBe('1.2.3.4')
  })

  it('IPv6는 같은 /64 대역을 한 키로 묶는다', () => {
    expect(ipKey('2001:db8:aa:1::1')).toBe('2001:db8:aa:1::/64')
    expect(ipKey('2001:0db8:00aa:0001:ffff:1:2:3')).toBe('2001:db8:aa:1::/64')
    expect(ipKey('2001:db8::5')).toBe('2001:db8:0:0::/64')
  })
})
