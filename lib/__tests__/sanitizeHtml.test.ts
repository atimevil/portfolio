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

  it('체크박스 할 일 목록(taskList/taskItem) 구조 보존 — data-type/data-checked 유지', () => {
    const html =
      '<ul data-type="taskList">' +
      '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>done</p></div></li>' +
      '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>todo</p></div></li>' +
      '</ul>'
    const out = sanitizeBlogHtml(html)
    expect(out).toContain('<ul data-type="taskList">')
    expect(out).toContain('data-checked="true"')
    expect(out).toContain('data-checked="false"')
    expect(out).toContain('done')
    expect(out).toContain('todo')
  })

  it('할 일 목록의 <input>은 공개 렌더에서 완전히 제거(체크박스는 CSS로만 표시) — data-checked는 남음', () => {
    const out = sanitizeBlogHtml(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">' +
        '<label><input type="image" src="x" onerror="alert(1)"><span></span></label><div><p>x</p></div>' +
        '</li></ul>'
    )
    expect(out).not.toContain('<input')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('<label')
    expect(out).toContain('<li data-type="taskItem" data-checked="true"')
  })

  it('콜아웃(div[data-callout]) 구조 보존 — 이모지·본문 유지', () => {
    const html =
      '<div data-callout><div data-callout-emoji>💡</div><div data-callout-body><p>안내 문구</p></div></div>'
    const out = sanitizeBlogHtml(html)
    expect(out).toContain('data-callout')
    expect(out).toContain('data-callout-emoji')
    expect(out).toContain('💡')
    expect(out).toContain('data-callout-body')
    expect(out).toContain('안내 문구')
  })

  it('토글(<details>/<summary>) 구조 보존', () => {
    const html =
      '<details><summary>더 보기</summary><div data-toggle-body><p>숨겨진 본문</p></div></details>'
    const out = sanitizeBlogHtml(html)
    expect(out).toContain('<details>')
    expect(out).toContain('<summary>더 보기</summary>')
    expect(out).toContain('data-toggle-body')
    expect(out).toContain('숨겨진 본문')
  })

  it('적대적 div(onclick·style=position:fixed)는 이벤트 핸들러·style 모두 제거 — div에는 style이 화이트리스트에 없어 통째로 제거', () => {
    const out = sanitizeBlogHtml('<div onclick="alert(1)" style="position:fixed;top:0;left:0">y</div>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('style=')
    expect(out).not.toContain('position:fixed')
    expect(out).toContain('y')
  })
})
