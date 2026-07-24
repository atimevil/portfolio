import { describe, it, expect } from 'vitest'
import { renderBlogHtml } from '@/lib/renderBlogHtml'

describe('renderBlogHtml', () => {
  it('script 제거 + 코드 하이라이트 + 본문 보존', async () => {
    const out = await renderBlogHtml(
      '<h2>제목</h2><script>alert(1)</script>' +
        '<pre><code class="language-js">const a = 1</code></pre><p>본문</p>'
    )
    expect(out).not.toContain('<script')
    expect(out).toContain('<h2>제목</h2>')
    expect(out).toContain('<p>본문</p>')
    expect(out).toContain('data-rehype-pretty-code-figure') // 마크다운 글과 동일 구조
    expect(out).toMatch(/style="color/) // shiki 토큰 색상
  })

  it('javascript: 링크·onerror 제거', async () => {
    const out = await renderBlogHtml('<a href="javascript:x()">l</a><img src="/u/x.png" onerror="y()">')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('onerror')
    expect(out).toContain('src="/u/x.png"')
  })
})
