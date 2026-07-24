// @vitest-environment jsdom
// RichEditor와 동일한 확장 구성으로 html→에디터→html 왕복이 안정(무손실)인지 검증한다.
// (핵심: 마크다운 재직렬화가 없으므로 한 번 정규화된 뒤엔 재배열이 없다)
// 확장 목록은 RichEditor.tsx의 richEditorExtensions를 그대로 import해 공유한다
// (Placeholder/BubbleMenu는 getHTML() 출력에 영향을 주지 않으므로 왕복 결과는 그대로 안정적이다).
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { richEditorExtensions } from '../RichEditor'

function roundtrip(html: string): string {
  const e = new Editor({ extensions: richEditorExtensions, content: html })
  const out = e.getHTML()
  e.destroy()
  return out
}

describe('RichEditor html 왕복', () => {
  it('html→에디터→html 이 안정(idempotent) — 재배열 없음', () => {
    const html =
      '<h2>제목</h2><p><strong>굵게</strong></p>' +
      '<pre><code class="language-js">const a = 1</code></pre>' +
      '<img src="/uploads/blog/x.png" alt="a">' +
      '<ul><li><p>하나</p></li><li><p>둘</p></li></ul>'
    const once = roundtrip(html)
    const twice = roundtrip(once)
    expect(twice).toBe(once) // 한 번 정규화 후 완전 안정
    expect(once).toContain('language-js')
    expect(once).toContain('src="/uploads/blog/x.png"')
    expect(once).toContain('<h2>')
  })
})
