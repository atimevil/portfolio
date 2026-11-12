import { describe, it, expect, beforeEach } from 'vitest'
import { shouldCountView, resetViewDedupe } from '@/lib/viewDedupe'

beforeEach(resetViewDedupe)

const HOUR = 60 * 60 * 1000

describe('shouldCountView', () => {
  it('같은 방문자가 같은 글을 다시 열면 세지 않는다', () => {
    expect(shouldCountView('1.2.3.4', 'post-a', 0)).toBe(true)
    expect(shouldCountView('1.2.3.4', 'post-a', 1000)).toBe(false)
    expect(shouldCountView('1.2.3.4', 'post-a', 5 * HOUR)).toBe(false)
  })

  it('다른 글·다른 방문자는 따로 센다', () => {
    expect(shouldCountView('1.2.3.4', 'post-a', 0)).toBe(true)
    expect(shouldCountView('1.2.3.4', 'post-b', 0)).toBe(true)
    expect(shouldCountView('5.6.7.8', 'post-a', 0)).toBe(true)
  })

  it('6시간이 지나면 다시 센다', () => {
    expect(shouldCountView('1.2.3.4', 'post-a', 0)).toBe(true)
    expect(shouldCountView('1.2.3.4', 'post-a', 6 * HOUR + 1)).toBe(true)
  })

  it('IPv6는 같은 /64 대역을 한 방문자로 본다', () => {
    expect(shouldCountView('2001:db8:1:2::1', 'post-a', 0)).toBe(true)
    expect(shouldCountView('2001:db8:1:2:aaaa:bbbb:cccc:dddd', 'post-a', 0)).toBe(false)
    expect(shouldCountView('2001:db8:1:3::1', 'post-a', 0)).toBe(true)
  })

  it('기억하는 수에 상한이 있어도 최근 방문은 계속 걸러낸다', () => {
    for (let i = 0; i < 20_050; i++) shouldCountView(`10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`, 'post-a', 0)
    expect(shouldCountView('9.9.9.9', 'post-a', 1)).toBe(true)
    expect(shouldCountView('9.9.9.9', 'post-a', 2)).toBe(false)
  })
})
