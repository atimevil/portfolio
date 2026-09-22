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

  it('문단 전체를 감싼 굵게만 풀고, 문장 안 일부 강조는 남긴다', async () => {
    const out = await renderBlogHtml(
      '<p><strong>일직선 상에 돌들이 놓여있고, 개구리가 처음에는 앉아 있다.</strong></p>' +
        '<p> <strong>앞뒤 공백만 있는 경우</strong> </p>' +
        '<p>여기서 <strong>핵심</strong>은 최소 점프다.</p>' +
        '<h3><strong>문제</strong></h3>' +
        '<p><strong>- 제한시간 : 1초</strong><br><strong>- 메모리 : 256MB</strong></p>',
    )
    expect(out).toContain('<p>일직선 상에 돌들이 놓여있고, 개구리가 처음에는 앉아 있다.</p>')
    expect(out).toMatch(/<p>\s*앞뒤 공백만 있는 경우\s*<\/p>/) // 공백은 원문 그대로 둔다(화면에선 합쳐진다)
    expect(out).toContain('<p>여기서 <strong>핵심</strong>은 최소 점프다.</p>')
    expect(out).toContain('<h2><strong>문제</strong></h2>') // 제목의 굵게는 문단이 아니라 그대로(단계는 h2로 맞춰짐)
    expect(out).toContain('<p>- 제한시간 : 1초<br>- 메모리 : 256MB</p>') // 굵게 여러 조각으로 쪼개진 문단
  })

  it('제목은 본문의 가장 높은 단계가 h2가 되게 옮기고, 코드 블록은 키보드로 들어갈 수 있다', async () => {
    const out = await renderBlogHtml('<h3>문제</h3><h4>입력</h4><p>본문</p><pre><code>x</code></pre>')
    expect(out).toContain('<h2>문제</h2>')
    expect(out).toContain('<h3>입력</h3>') // 상하 관계 유지
    expect(out).toMatch(/<pre[^>]*tabindex="0"/)
    const h1 = await renderBlogHtml('<h1>본문 속 h1</h1><h2>아래</h2>')
    expect(h1).toContain('<h2>본문 속 h1</h2>') // 페이지 제목 h1과 겹치지 않게
    expect(h1).toContain('<h3>아래</h3>')
  })
})
