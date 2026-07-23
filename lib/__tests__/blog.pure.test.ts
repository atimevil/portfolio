import { describe, it, expect } from 'vitest'
import { stripMarkdown, truncateExcerpt } from '@/lib/blog'

describe('stripMarkdown', () => {
  it('strips code fences, images, links, headings, quotes, lists', () => {
    const md = [
      '# 제목',
      '',
      '> 인용문',
      '',
      '- 불릿1',
      '- 불릿2',
      '',
      '1. 번호목록',
      '',
      '```js',
      'const x = 1',
      '```',
      '',
      '![alt](/img.png)',
      '[링크텍스트](https://example.com)',
      '',
      '**굵게** _기울임_ `코드`',
    ].join('\n')

    const result = stripMarkdown(md)

    expect(result).not.toContain('#')
    expect(result).not.toContain('>')
    expect(result).not.toContain('```')
    expect(result).not.toContain('![')
    expect(result).toContain('링크텍스트')
    expect(result).not.toContain('[링크텍스트]')
    expect(result).toContain('굵게')
    expect(result).not.toContain('**')
  })
})

describe('truncateExcerpt', () => {
  it('returns text unchanged when at or under the limit', () => {
    const short = '짧은 텍스트'
    expect(truncateExcerpt(short)).toBe(short)
  })

  it('truncates long text at a word boundary and appends ellipsis', () => {
    const long = 'a'.repeat(200)
    const result = truncateExcerpt(long)
    expect(result.length).toBeLessThan(long.length)
    expect(result.endsWith('…')).toBe(true)
  })
})
