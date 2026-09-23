import { describe, it, expect } from 'vitest'
import { stripMarkdown, truncateExcerpt } from '@/lib/blog'

describe('stripMarkdown', () => {
  it('접기 버튼 글자(<summary>)는 빼고 접힌 내용은 남긴다', () => {
    const html = '<p>SCPC 2015 1차 예선 문제</p><details><summary>더보기</summary><div>일직선 상에 돌들이 놓여있고</div></details>'
    expect(stripMarkdown(html)).toBe('SCPC 2015 1차 예선 문제 일직선 상에 돌들이 놓여있고')
  })

  it('태그 없이 홀로 남은 "더보기" 줄도 뺀다 (티스토리 접기 위젯이 태그 없이 옮겨온 경우)', () => {
    // 34개 마크다운 글에서 실제로 발견된 패턴: 소제목 다음 줄에 "더보기"만 단독으로 남아 있음
    const md = '### **문제**\n\n더보기\n\n**일직선 상에 돌들이 놓여있고**'
    expect(stripMarkdown(md)).toBe('문제 일직선 상에 돌들이 놓여있고')
  })

  it('"더보기"가 문장 일부로 쓰였으면 지우지 않는다 (단독 줄일 때만 접기 위젯으로 본다)', () => {
    expect(stripMarkdown('버튼을 누르면 더보기가 나타난다')).toBe('버튼을 누르면 더보기가 나타난다')
  })

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
