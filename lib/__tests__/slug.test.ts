import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('영문 제목을 소문자 kebab-case로 바꾼다', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('한글 제목을 그대로 유지한다', () => {
    expect(slugify('안녕 세상')).toBe('안녕-세상')
  })

  it('한글과 영문이 섞인 제목을 처리한다', () => {
    expect(slugify('BFS 너비 우선 탐색')).toBe('bfs-너비-우선-탐색')
  })

  it('허용되지 않는 기호를 제거한다', () => {
    expect(slugify('Hello, World! (2024)')).toBe('hello-world-2024')
  })

  it('연속된 공백을 하이픈 하나로 합친다', () => {
    expect(slugify('a    b')).toBe('a-b')
  })

  it('앞뒤 공백 때문에 하이픈이 붙지 않는다', () => {
    expect(slugify('  안녕  ')).toBe('안녕')
  })

  it('앞뒤 하이픈을 제거한다', () => {
    expect(slugify('- 안녕 -')).toBe('안녕')
  })

  it('NFD로 분해된 한글을 NFC로 합쳐서 보존한다', () => {
    expect(slugify('테스트'.normalize('NFD'))).toBe('테스트'.normalize('NFC'))
  })

  it('결과가 비면 post로 폴백한다', () => {
    expect(slugify('!!!')).toBe('post')
    expect(slugify('')).toBe('post')
  })
})
