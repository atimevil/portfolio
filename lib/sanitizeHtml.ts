import sanitizeHtml from 'sanitize-html'

// 텍스트 색(span[style])·형광펜(mark[style])의 color/background-color 값으로 허용하는 패턴.
// hex/rgb/rgba/hsl/hsla/명명색(named color)만 통과 — url(...)·expression(...)·`/*` 등 괄호·특수문자가
// 섞인 값은 어떤 패턴과도 매치되지 않아 sanitize-html이 해당 style 선언 전체를 제거한다.
const SAFE_COLOR_VALUE_PATTERNS = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/,
  /^hsl\(\s*\d+\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/,
  /^hsla\(\s*\d+\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*[\d.]+\s*\)$/,
  /^[a-z]+$/i, // named color (red, transparent, ...) — 괄호가 없어 함수형 페이로드는 여기 매치 불가
]

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
      // 텍스트 색(span[style])·형광펜(mark[style], mark[data-color])
      span: ['style'],
      mark: ['style', 'data-color'],
      // 코드 하이라이트(hljs/language-*)·prose용 class는 모든 태그에 허용
      '*': ['class'],
    },
    // style 속성 안에서도 color/background-color 두 속성만 허용(그 외 속성명은 통째로 제거).
    allowedStyles: {
      span: {
        color: SAFE_COLOR_VALUE_PATTERNS,
      },
      mark: {
        color: SAFE_COLOR_VALUE_PATTERNS,
        'background-color': SAFE_COLOR_VALUE_PATTERNS,
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    // 상대경로 이미지(/uploads/blog/…)는 sanitize-html이 기본 허용
    // script/style/on* 는 기본적으로 제거됨
  })
}
