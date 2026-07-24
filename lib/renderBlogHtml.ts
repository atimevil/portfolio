import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'
import { sanitizeBlogHtml } from '@/lib/sanitizeHtml'

// contentFormat='html' 글의 공개 렌더용 HTML을 만든다.
// 1) sanitize로 사용자 콘텐츠의 위험 요소 제거(script/on*/style)
// 2) rehype-pretty-code로 코드블록 하이라이트 — 마크다운 글과 동일한 shiki 출력이라
//    기존 .prose CSS를 그대로 재사용(시각적 동등). 하이라이트 span/style은 sanitize
//    이후 우리 코드가 붙이므로 안전.
export async function renderBlogHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypePrettyCode, { theme: 'material-theme-palenight', keepBackground: false })
    .use(rehypeStringify)
    .process(sanitizeBlogHtml(html))
  return String(file)
}
