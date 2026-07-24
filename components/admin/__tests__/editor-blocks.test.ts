// @vitest-environment jsdom
// Notion형 블록(콜아웃/토글/체크박스/표/색상/형광펜 등)이 (1) 에디터에서 올바른 구조로
// 생성/파싱되는지, (2) 왕복(html→에디터→html)이 안정적인지, (3) 공개 페이지 렌더 파이프라인
// (sanitize + rehype-pretty-code)을 거쳐도 살아남는지, (4) 적대적 입력이 무해화되는지 검증한다.
// 확장 목록은 RichEditor.tsx의 richEditorExtensions를 그대로 import해 공유한다.
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { richEditorExtensions } from '../RichEditor'
import { renderBlogHtml } from '@/lib/renderBlogHtml'

// 새 Editor를 만들고 콜백으로 명령을 실행한 뒤 getHTML()을 반환하고 정리한다.
function withEditor(run: (e: Editor) => void, content = '<p></p>'): string {
  const e = new Editor({ extensions: richEditorExtensions, content })
  run(e)
  const html = e.getHTML()
  e.destroy()
  return html
}

// setContent만으로 파싱→직렬화 결과를 확인할 때 쓰는 축약형.
function parseRoundtrip(html: string): string {
  return withEditor(() => {}, html)
}

describe('블록별 에디터 동작', () => {
  it('heading h1/h2/h3 — toggleHeading', () => {
    expect(withEditor((e) => e.chain().focus().toggleHeading({ level: 1 }).run())).toContain('<h1>')
    expect(withEditor((e) => e.chain().focus().toggleHeading({ level: 2 }).run())).toContain('<h2>')
    expect(withEditor((e) => e.chain().focus().toggleHeading({ level: 3 }).run())).toContain('<h3>')
  })

  it('불릿 목록 — toggleBulletList', () => {
    const html = withEditor((e) => e.chain().focus().insertContent('항목').toggleBulletList().run())
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
    expect(html).toContain('항목')
  })

  it('번호 목록 — toggleOrderedList', () => {
    const html = withEditor((e) => e.chain().focus().insertContent('항목').toggleOrderedList().run())
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>')
  })

  it('체크박스(taskList) — toggleTaskList로 삽입', () => {
    const html = withEditor((e) => e.chain().focus().insertContent('할 일').toggleTaskList().run())
    expect(html).toContain('data-type="taskList"')
    expect(html).toContain('data-type="taskItem"')
    expect(html).toContain('data-checked="false"') // 기본 미완료
  })

  it('체크박스(taskList) — 완료/미완료 상태가 파싱·직렬화에서 보존', () => {
    const html = parseRoundtrip(
      '<ul data-type="taskList">' +
        '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>완료</p></div></li>' +
        '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>미완료</p></div></li>' +
        '</ul>',
    )
    expect(html).toContain('data-checked="true"')
    expect(html).toContain('data-checked="false"')
    expect(html).toContain('완료')
    expect(html).toContain('미완료')
  })

  it('인용 — toggleBlockquote', () => {
    const html = withEditor((e) => e.chain().focus().insertContent('인용문').toggleBlockquote().run())
    expect(html).toContain('<blockquote>')
    expect(html).toContain('인용문')
  })

  it('코드 블록 — toggleCodeBlock({ language }) → pre>code.language-*', () => {
    const html = withEditor((e) =>
      e.chain().focus().insertContent('const a = 1').toggleCodeBlock({ language: 'js' }).run(),
    )
    expect(html).toMatch(/<pre><code class="language-js">/)
    expect(html).toContain('const a = 1')
  })

  it('표 — insertTable(3x3, withHeaderRow)', () => {
    const html = withEditor((e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    )
    expect(html).toContain('<table')
    expect(html).toContain('<th')
    expect(html).toContain('<td')
    expect((html.match(/<tr>/g) ?? []).length).toBe(3)
  })

  it('구분선 — setHorizontalRule', () => {
    const html = withEditor((e) => e.chain().focus().insertContent('a').setHorizontalRule().run())
    expect(html).toContain('<hr>')
  })

  it('콜아웃 — setCallout → div[data-callout] + 이모지 + 본문', () => {
    const html = withEditor((e) => e.chain().focus().setCallout().run())
    expect(html).toContain('data-callout')
    expect(html).toContain('data-callout-emoji')
    expect(html).toContain('💡')
    expect(html).toContain('data-callout-body')
  })

  it('토글 — setToggle → details/summary/data-toggle-body', () => {
    const html = withEditor((e) => e.chain().focus().setToggle().run())
    expect(html).toContain('<details>')
    expect(html).toContain('<summary>')
    expect(html).toContain('data-toggle-body')
  })

  it('토글 본문에 콜아웃 등 블록 콘텐츠를 채워도 구조 유지', () => {
    const html = withEditor((e) => {
      e.chain().focus().setToggle().run()
      // 토글 삽입 직후 커서는 toggleBody의 첫 문단 안에 위치 — 텍스트를 채워 확인.
      e.chain().insertContent('토글 본문 내용').run()
    })
    expect(html).toContain('<details>')
    expect(html).toContain('data-toggle-body')
    expect(html).toContain('토글 본문 내용')
  })

  it('글자색 — setColor → span[style*="color"]', () => {
    const html = withEditor((e) => {
      e.commands.setContent('<p>hello</p>')
      e.commands.selectAll()
      e.commands.setColor('#e11d48')
    })
    // jsdom의 CSSOM이 style.color를 읽는 과정에서 hex를 rgb(...)로 정규화하므로 값 자체보단
    // color 스타일 선언이 span에 실렸는지를 검증한다(브라우저에서도 동일하게 정규화된다).
    expect(html).toMatch(/<span style="color: ?rgb\(\d+,\s*\d+,\s*\d+\);?">/)
  })

  it('형광펜 — toggleHighlight → mark', () => {
    const html = withEditor((e) => {
      e.commands.setContent('<p>hello</p>')
      e.commands.selectAll()
      e.commands.toggleHighlight({ color: '#fef08a' })
    })
    expect(html).toContain('<mark')
    expect(html).toMatch(/background-color: ?rgb\(\d+,\s*\d+,\s*\d+\)/)
  })
})

// 여러 블록을 함께 담은 문서 — 다음 라운드트립/파이프라인 테스트가 공유한다.
// (실제 렌더 함수들이 만드는 정확한 태그 형태를 기준으로 구성했다.)
const ALL_BLOCKS_HTML =
  '<h1>제목1</h1><h2>제목2</h2><h3>제목3</h3>' +
  '<p><strong>굵게</strong> <span style="color: #e11d48">색상</span> ' +
  '<mark data-color="#fef08a" style="background-color: #fef08a; color: inherit">형광펜</mark></p>' +
  '<ul><li><p>불릿1</p></li><li><p>불릿2</p></li></ul>' +
  '<ol><li><p>번호1</p></li><li><p>번호2</p></li></ol>' +
  '<ul data-type="taskList">' +
  '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>완료</p></div></li>' +
  '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>미완료</p></div></li>' +
  '</ul>' +
  '<blockquote><p>인용문</p></blockquote>' +
  '<pre><code class="language-js">const a = 1</code></pre>' +
  '<table><tbody><tr><th>H1</th><th>H2</th></tr><tr><td>1</td><td>2</td></tr></tbody></table>' +
  '<hr>' +
  '<div data-callout><div data-callout-emoji>💡</div><div data-callout-body><p>콜아웃 본문</p></div></div>' +
  '<details><summary>토글 제목</summary><div data-toggle-body><p>토글 본문</p></div></details>' +
  '<img src="/uploads/blog/x.png" alt="이미지">'

describe('에디터 왕복(round-trip) 안정성', () => {
  it('모든 블록을 포함한 문서가 html→에디터→html 두 번째 라운드부터 안정(idempotent)', () => {
    const once = parseRoundtrip(ALL_BLOCKS_HTML)
    const twice = parseRoundtrip(once)
    expect(twice).toBe(once)
    // 정규화 후에도 각 블록이 실제로 남아 있는지 확인(빈 배열로 다 사라지는 거짓 통과 방지).
    expect(once).toContain('<h1>')
    expect(once).toContain('data-type="taskList"')
    expect(once).toContain('data-checked="true"')
    expect(once).toContain('data-callout')
    expect(once).toContain('<details>')
    expect(once).toContain('language-js')
    expect(once).toContain('<table')
  })
})

describe('공개 파이프라인(renderBlogHtml) — 모든 블록 생존', () => {
  it('콜아웃/토글/체크박스/표/색상/형광펜/이미지/코드가 공개 HTML에서 모두 살아남는다', async () => {
    const out = await renderBlogHtml(ALL_BLOCKS_HTML)

    // 텍스트 블록
    expect(out).toContain('<h1>제목1</h1>')
    expect(out).toContain('<h2>제목2</h2>')
    expect(out).toContain('<h3>제목3</h3>')
    expect(out).toContain('인용문')
    expect(out).toContain('<blockquote>')

    // 색상/형광펜
    expect(out).toMatch(/<span style="color:\s*#e11d48">색상<\/span>/)
    expect(out).toMatch(/<mark[^>]*style="background-color:\s*#fef08a[^"]*"[^>]*>형광펜<\/mark>/)

    // 체크박스 목록 — data-checked 보존, <input>/<label>은 공개 렌더에서 제거(CSS로만 표시)
    expect(out).toContain('data-type="taskList"')
    expect(out).toMatch(/<li data-type="taskItem" data-checked="true"/)
    expect(out).toMatch(/<li data-type="taskItem" data-checked="false"/)
    expect(out).toContain('완료')
    expect(out).not.toContain('<input')
    expect(out).not.toContain('<label')

    // 표
    expect(out).toContain('<table>')
    expect(out).toContain('<th>H1</th>')
    expect(out).toContain('<td>1</td>')

    // 구분선
    expect(out).toContain('<hr')

    // 콜아웃
    expect(out).toContain('data-callout')
    expect(out).toContain('💡')
    expect(out).toContain('콜아웃 본문')

    // 토글 — 네이티브 details/summary
    expect(out).toContain('<details>')
    expect(out).toContain('<summary>토글 제목</summary>')
    expect(out).toContain('data-toggle-body')
    expect(out).toContain('토글 본문')

    // 이미지
    expect(out).toContain('src="/uploads/blog/x.png"')

    // 코드 — rehype-pretty-code가 syntax highlighting을 입힌 구조로 치환
    // (토큰마다 <span style="color:...">로 쪼개지므로 "const a = 1" 연속 문자열은 더 이상
    // 존재하지 않는다 — 토큰 단위로 존재 여부를 확인한다)
    expect(out).toContain('data-rehype-pretty-code-figure')
    expect(out).toMatch(/style="color:/)
    expect(out).toContain('const')
    expect(out).toContain('data-language="js"')
  })
})

describe('공개 파이프라인(renderBlogHtml) — 적대적 입력 무해화', () => {
  it('script/onclick/오버레이 class/javascript 링크/onerror가 모두 제거되고 안전한 부분은 보존', async () => {
    const hostile =
      '<script>alert(1)</script>' +
      '<mark onclick="steal()">클릭</mark>' +
      '<div data-callout class="fixed inset-0 z-50 opacity-0">오버레이</div>' +
      '<a href="https://example.com" target="_blank">링크</a>' +
      '<img src="/u/x.png" onerror="alert(1)">' +
      '<pre><code class="language-js evil-tracker">const a = 1</code></pre>'

    const out = await renderBlogHtml(hostile)

    // <script> 완전 제거
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')

    // mark의 onclick 제거, 텍스트/태그는 보존
    expect(out).not.toContain('onclick')
    expect(out).toContain('클릭')
    expect(out).toContain('<mark>클릭</mark>')

    // div의 오버레이 클릭재킹 class 전부 제거(전역 class 화이트리스트 없음), data-callout은 유지
    expect(out).not.toContain('fixed')
    expect(out).not.toContain('inset-0')
    expect(out).not.toContain('z-50')
    expect(out).toContain('data-callout')
    expect(out).toContain('오버레이')

    // target=_blank 링크는 rel=noopener 강제(역-탭내빙 방지)
    expect(out).toMatch(/<a href="https:\/\/example\.com" target="_blank" rel="noopener/)

    // img의 onerror 제거, src는 보존
    expect(out).not.toContain('onerror')
    expect(out).toContain('src="/u/x.png"')

    // code/pre는 language-* class만 유지되어 rehype-pretty-code가 언어를 인식 — 결과물에서는
    // class="language-js"가 data-language="js"로 치환된다(하이라이트 처리 구조). 임의
    // class(evil-tracker)는 sanitize 단계에서 제거되어 하이라이터에 전달조차 되지 않는다.
    expect(out).toContain('data-language="js"')
    expect(out).not.toContain('evil-tracker')
  })
})
