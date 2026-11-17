import { describe, it, expect } from 'vitest'
import { snapImageWidth } from '@/lib/imageLayout'

describe('snapImageWidth', () => {
  it('10% 단위로 맞추고 10~90 사이로 자른다', () => {
    expect(snapImageWidth(33)).toBe(30)
    expect(snapImageWidth(36)).toBe(40)
    expect(snapImageWidth(2)).toBe(10)
  })
  it('글 폭에 가까우면 null(글 폭)', () => {
    expect(snapImageWidth(96)).toBeNull()
    expect(snapImageWidth(140)).toBeNull()
    expect(snapImageWidth(NaN)).toBeNull()
  })
})
