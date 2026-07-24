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
      // 콜아웃(div[data-callout])·토글(details/summary) — 커스텀 블록 노드
      'div', 'details', 'summary',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      // 텍스트 색(span[style])·형광펜(mark[style], mark[data-color])
      span: ['style'],
      mark: ['style', 'data-color'],
      // 체크박스 할 일 목록(taskList/taskItem) — <input>은 허용하지 않고(공개 페이지는 인터랙티브 폼 요소
      // 없이 정적이어야 함) data-checked만 보존해 CSS(::before)로 체크박스를 시각적으로만 그린다.
      ul: ['data-type'],
      li: ['data-type', 'data-checked'],
      // 콜아웃/토글이 쓰는 div는 data-* 마커만 허용(style 등은 금지 — 화이트리스트를 좁게 유지).
      div: ['data-callout', 'data-callout-emoji', 'data-callout-body', 'data-toggle-body'],
      // class는 코드블록 언어 표시(rehype-pretty-code 입력)에만 필요 → code/pre에만, 값은 아래 allowedClasses로 제한.
      // 전역 class 허용은 Tailwind 유틸 class(fixed/inset-0/z-50 등)로 전체화면 오버레이 클릭재킹이 가능해 제거함(보안 리뷰).
      code: ['class'],
      pre: ['class'],
    },
    // class 값은 language-*/hljs만(코드 하이라이트). 그 외 class는 전부 제거.
    allowedClasses: {
      code: ['language-*', 'hljs'],
      pre: ['language-*', 'hljs'],
    },
    // target=_blank 링크엔 rel="noopener noreferrer" 강제 — 역-탭내빙(window.opener) 방지.
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target) attribs.rel = 'noopener noreferrer'
        return { tagName, attribs }
      },
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
