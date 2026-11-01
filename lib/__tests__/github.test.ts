import { describe, expect, it } from 'vitest'
import { githubHandle } from '@/lib/github'

describe('githubHandle', () => {
  it('주소 끝의 계정 이름을 꺼낸다', () => {
    expect(githubHandle('https://github.com/foxibu')).toBe('foxibu')
  })
  it('끝 슬래시와 앞뒤 공백을 무시한다', () => {
    expect(githubHandle(' https://github.com/foxibu/ ')).toBe('foxibu')
  })
})
