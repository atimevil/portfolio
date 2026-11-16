import { describe, it, expect } from 'vitest'
import { renderBlogHtml } from '@/lib/renderBlogHtml'

const G = [
  { match: 'BT', tip: 'BT는 행동 트리' },
  { match: '순이득', tip: '체력 차' },
]

describe('rehypeGlossary', () => {
  it('용어의 첫 등장에만 abbr을 붙이고 나머지는 그대로 둔다', async () => {
    const out = await renderBlogHtml('<p>BT가 이겼다. BT는 빠르다.</p>', G)
    expect(out.match(/<abbr /g)?.length).toBe(1)
    expect(out).toContain('<abbr data-tip="BT는 행동 트리" tabindex="0">BT</abbr>가 이겼다. BT는 빠르다.')
  })

  it('제목·링크·코드 안은 건너뛰고 그 다음 본문 등장에 붙인다', async () => {
    const out = await renderBlogHtml('<h2>BT 이야기</h2><p><a href="/x">BT</a> 그리고 <code>BT</code> 그리고 BT</p>', G)
    expect(out).toContain('<h2>BT 이야기</h2>')
    expect(out.match(/<abbr /g)?.length).toBe(1)
    expect(out).toMatch(/그리고 <abbr [^>]*>BT<\/abbr><\/p>/)
  })

  it('영문 용어는 다른 단어의 일부에 붙지 않는다', async () => {
    const out = await renderBlogHtml('<p>OBTAINBT와 BTS 그리고 BT</p>', G)
    expect(out.match(/<abbr /g)?.length).toBe(1)
    expect(out).toMatch(/그리고 <abbr [^>]*>BT<\/abbr>/)
  })

  it('글 속 따옴표·꺾쇠가 있는 뜻도 속성으로 안전하게 나간다', async () => {
    const out = await renderBlogHtml('<p>순이득</p>', [{ match: '순이득', tip: 'a "b" <c>' }])
    // 따옴표는 &#x22;로 나가서 속성을 끊지 못한다(꺾쇠는 속성값 안에서 해롭지 않다)
    expect(out).toContain('data-tip="a &#x22;b&#x22; <c>"')
    expect(out.match(/<abbr /g)?.length).toBe(1)
  })

  it('사전이 없으면 글을 그대로 둔다', async () => {
    const out = await renderBlogHtml('<p>BT</p>')
    expect(out).not.toContain('<abbr')
  })
})
