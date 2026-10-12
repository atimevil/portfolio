import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypePostA11y from '@/lib/mdx/rehypePostA11y'

async function run(html: string) {
  return String(await unified().use(rehypeParse, { fragment: true }).use(rehypePostA11y).use(rehypeStringify).process(html))
}

describe('rehypePostA11y 이미지', () => {
  it('빈 alt는 바로 앞 제목으로 채우고, 첫 장을 뺀 나머지는 지연 로딩한다', async () => {
    const out = await run('<img src="/a.png"><h2>네트워크 <code>flow</code></h2><img src="/b.png"><img src="/c.png" alt="직접 쓴 설명">')
    expect(out).toContain('<img src="/a.png" alt="" decoding="async">')
    expect(out).toContain('<img src="/b.png" alt="네트워크 flow" decoding="async" loading="lazy">')
    expect(out).toContain('<img src="/c.png" alt="직접 쓴 설명" decoding="async" loading="lazy">')
  })
})
