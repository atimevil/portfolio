import sanitizeHtml from 'sanitize-html'

// 무손실 에디터(contentFormat='html')가 저장한 본문을 공개 렌더 전에 정제한다.
// 작성자는 단일 관리자(신뢰)지만 script/on*/iframe 등을 제거하는 심층 방어.
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 's', 'del', 'mark', 'sub', 'sup',
      'a', 'img',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'span',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      // 코드 하이라이트(hljs/language-*)·prose용 class는 모든 태그에 허용
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    // 상대경로 이미지(/uploads/blog/…)는 sanitize-html이 기본 허용
    // script/style/on* 는 기본적으로 제거됨
  })
}
