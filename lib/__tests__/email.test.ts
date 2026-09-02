import { describe, it, expect } from 'vitest'
import { cleanEmail } from '@/lib/email'

describe('cleanEmail', () => {
  it('정상 주소는 그대로 돌려준다', () => {
    expect(cleanEmail('atimevil@gmail.com')).toBe('atimevil@gmail.com')
  })

  it('앞뒤 공백은 다듬는다', () => {
    expect(cleanEmail('  atimevil@gmail.com  ')).toBe('atimevil@gmail.com')
  })

  it('비어있거나 공백뿐이면 null (빈 mailto: 링크 방지)', () => {
    expect(cleanEmail('')).toBeNull()
    expect(cleanEmail('   ')).toBeNull()
    expect(cleanEmail(undefined)).toBeNull()
    expect(cleanEmail(null)).toBeNull()
  })

  it('mailto 헤더로 해석될 수 있는 값은 거른다', () => {
    expect(cleanEmail('a@b.com?subject=spam')).toBeNull()
    expect(cleanEmail('a@b.com&body=x')).toBeNull()
    expect(cleanEmail('a b@c.com')).toBeNull()
  })

  it('주소 형태가 아니면 거른다', () => {
    expect(cleanEmail('atimevil')).toBeNull()
    expect(cleanEmail('atimevil@gmail')).toBeNull()
    expect(cleanEmail('@gmail.com')).toBeNull()
  })
})
