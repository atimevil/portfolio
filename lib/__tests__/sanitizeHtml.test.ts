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
})
