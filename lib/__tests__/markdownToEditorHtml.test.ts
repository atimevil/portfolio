// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { markdownToEditorHtml } from '@/lib/markdownToEditorHtml'

describe('markdownToEditorHtml', () => {
  it('대표 마크다운(제목·굵게·코드펜스·이미지·목록·표)을 에디터 HTML로 변환', () => {
    const md = [
      '# 제목',
      '',
      '**굵게** 텍스트',
      '',
      '```js',
      'const a = 1',
      '```',
      '',
      '![alt](/uploads/blog/x.png)',
      '',
      '- 하나',
      '- 둘',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
    ].join('\n')

    const html = markdownToEditorHtml(md)

    expect(html).toContain('<h1>')
    expect(html).toContain('<strong>')
    expect(html).toMatch(/<pre><code[^>]*language-js/)
    expect(html).toContain('<img')
    expect(html).toContain('src="/uploads/blog/x.png"')
    expect(html).toContain('<ul')
    expect(html).toContain('<li>')
    expect(html).toContain('<table')
  })
})
