import { describe, it, expect } from 'vitest'
import { sanitizeBlogHtml } from '@/lib/sanitizeHtml'

describe('sanitizeBlogHtml', () => {
  it('script/onerror/iframe/style 같은 위험 요소 제거', () => {
    const out = sanitizeBlogHtml(
      '<p>ok</p><script>alert(1)</script><img src="/u/x.png" onerror="alert(1)"><iframe src="e"></iframe>'
    )
    expect(out).not.toContain('<script')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('<iframe')
    expect(out).toContain('<p>ok</p>')
    expect(out).toContain('src="/u/x.png"')
  })

  it('허용 태그·코드 class·표·링크·이미지 보존', () => {
    const html =
      '<h2>t</h2><pre><code class="language-js hljs"><span class="hljs-keyword">const</span></code></pre>' +
      '<table><tbody><tr><td colspan="2">c</td></tr></tbody></table>' +
      '<a href="https://e.com" rel="noopener">l</a><img src="/u/a.png" alt="a">'
    const out = sanitizeBlogHtml(html)
    expect(out).toContain('<h2>')
    expect(out).toContain('class="language-js hljs"')
    expect(out).toContain('hljs-keyword')
    expect(out).toContain('<table>')
    expect(out).toContain('colspan="2"')
    expect(out).toContain('href="https://e.com"')
    expect(out).toContain('<img')
    expect(out).toContain('alt="a"')
  })

  it('javascript: 링크 스킴 차단', () => {
    const out = sanitizeBlogHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })

  it('텍스트 색(span style)·형광펜(mark) 보존', () => {
    const out = sanitizeBlogHtml('<p><span style="color:#e11d48">x</span> <mark>y</mark></p>')
    expect(out).toContain('<span style="color:#e11d48">x</span>')
    expect(out).toContain('<mark>y</mark>')
  })

  it('위험한 style 값(url) 제거 — color는 남고 background/url은 제거', () => {
    const out = sanitizeBlogHtml('<span style="color:red;background:url(javascript:alert(1))">x</span>')
    expect(out).not.toContain('url(')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('background')
    expect(out).toContain('color:red')
  })

  it('allowedStyles에 없는 속성(width)은 제거', () => {
    const out = sanitizeBlogHtml('<span style="width:100px">x</span>')
    expect(out).not.toContain('width')
  })

  it('mark의 onclick 같은 이벤트 핸들러 속성 제거', () => {
    const out = sanitizeBlogHtml('<mark onclick="x()">y</mark>')
    expect(out).not.toContain('onclick')
    expect(out).toContain('<mark>y</mark>')
  })

  it('형광펜 배경색(mark style background-color)·data-color 보존', () => {
    const out = sanitizeBlogHtml('<mark data-color="#ffa8a8" style="background-color: #ffa8a8">y</mark>')
    expect(out).toContain('background-color:#ffa8a8')
    expect(out).toContain('data-color="#ffa8a8"')
  })
})
