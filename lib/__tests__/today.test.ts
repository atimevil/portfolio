import { describe, it, expect } from 'vitest'
import { todayKST } from '../today'

describe('todayKST', () => {
  it('UTC로는 전날이어도 서울 날짜를 준다', () => {
    expect(todayKST(new Date('2026-10-11T16:30:00Z'))).toBe('2026-10-12') // KST 01:30
  })
  it('YYYY-MM-DD 형식', () => {
    expect(todayKST(new Date('2026-01-05T03:00:00Z'))).toBe('2026-01-05')
  })
})
