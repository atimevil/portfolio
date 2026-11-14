/**
 * 글쓰기 템플릿 — 본문 틀(앞부분) + 돌아보기 틀(뒷부분)을 골라 이어 붙인다.
 * 소제목만 채우고 본문은 비워 둔다(에디터 네이티브 HTML). 소제목은 질문 형태라 그대로 두거나 고쳐 쓴다.
 */

export interface PostTemplate {
  id: string
  label: string
  description: string
  /** 소제목 목록 — 각 소제목 아래에 빈 문단이 붙는다 */
  headings: string[]
}

export const BODY_TEMPLATES: PostTemplate[] = [
  {
    id: 'activity',
    label: '활동 기록',
    description: '계기 → 한 일 → 내 역할 → 결과',
    headings: ['왜 시작했나', '무엇을 했나', '내가 맡은 부분', '결과'],
  },
  {
    id: 'star',
    label: 'STAR',
    description: '상황 → 과제 → 행동 → 결과 (이력서·지원서용)',
    headings: ['상황 (Situation)', '과제 (Task)', '행동 (Action)', '결과 (Result)'],
  },
  {
    id: 'timeline',
    label: '타임라인',
    description: '시간 순서대로 (해커톤처럼 흐름이 뚜렷한 활동)',
    headings: ['시작 전', '진행 과정', '막혔던 순간', '마무리'],
  },
]

export const REVIEW_TEMPLATES: PostTemplate[] = [
  {
    id: 'kpt',
    label: 'KPT',
    description: 'Keep · Problem · Try',
    headings: ['잘돼서 계속할 것 (Keep)', '막혔거나 아쉬웠던 것 (Problem)', '다음에 해 볼 것 (Try)'],
  },
  {
    id: '4l',
    label: '4L',
    description: 'Liked · Learned · Lacked · Longed for',
    headings: ['좋았던 것 (Liked)', '배운 것 (Learned)', '부족했던 것 (Lacked)', '바랐던 것 (Longed for)'],
  },
  {
    id: '4f',
    label: '4F',
    description: 'Facts · Feelings · Findings · Future',
    headings: ['있었던 일 (Facts)', '그때의 느낌 (Feelings)', '발견한 것 (Findings)', '앞으로 (Future)'],
  },
  {
    id: 'ssc',
    label: 'Start / Stop / Continue',
    description: '시작할 것 · 그만둘 것 · 계속할 것',
    headings: ['시작할 것 (Start)', '그만둘 것 (Stop)', '계속할 것 (Continue)'],
  },
  {
    id: 'msg',
    label: 'Mad / Sad / Glad',
    description: '화났던 것 · 아쉬웠던 것 · 기뻤던 것',
    headings: ['화났던 것 (Mad)', '아쉬웠던 것 (Sad)', '기뻤던 것 (Glad)'],
  },
  {
    id: 'wsn',
    label: 'What? So What? Now What?',
    description: '무슨 일 → 그래서 의미는 → 이제 무엇을',
    headings: ['무슨 일이 있었나 (What?)', '그래서 어떤 의미인가 (So What?)', '이제 무엇을 할까 (Now What?)'],
  },
]

// 회고 틀 앞에 붙는 구분 소제목 — 앞부분(사실)과 뒷부분(생각)을 나눈다.
const REVIEW_SECTION_TITLE = '돌아보기'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function sectionHtml(headings: string[], level: 2 | 3): string {
  return headings.map((h) => `<h${level}>${escapeHtml(h)}</h${level}><p></p>`).join('')
}

/** 고른 틀을 이어 붙인 에디터 HTML. 둘 다 없으면 빈 문자열. 모르는 id는 무시한다. */
export function buildTemplateHtml(bodyId: string, reviewId: string): string {
  const body = BODY_TEMPLATES.find((t) => t.id === bodyId)
  const review = REVIEW_TEMPLATES.find((t) => t.id === reviewId)

  let html = ''
  if (body) html += sectionHtml(body.headings, 2)
  if (review) {
    // 본문 틀이 없으면 틀 자체가 글 전체이므로 구분 소제목 없이 h2로 시작한다.
    html += body
      ? `<h2>${REVIEW_SECTION_TITLE}</h2><p></p>${sectionHtml(review.headings, 3)}`
      : sectionHtml(review.headings, 2)
  }
  return html
}

/**
 * 본문에 사용자가 쓴 내용이 있는지 — 템플릿 소제목(h1~h6 요소 전체가 소제목과 같은 것)과 빈 문단뿐이면 false.
 * 이미지·표·구분선·링크 같은 다른 요소가 하나라도 있으면 글자가 없어도 true(덮어쓰면 잃는다).
 * 본문 문단에 소제목과 같은 단어를 쓴 경우는 소제목이 아니므로 글로 센다.
 */
export function hasWrittenText(html: string, headings: string[] = allHeadings()): boolean {
  const known = new Set([...headings, REVIEW_SECTION_TITLE].map(escapeHtml))
  const withoutHeadings = html.replace(/<h[1-6]>([^<]*)<\/h[1-6]>/g, (m, inner: string) => (known.has(inner) ? '' : m))
  if (/<(?!\/?(p|br)\b)[a-z]/i.test(withoutHeadings)) return true
  return withoutHeadings.replace(/<[^>]*>/g, '').replace(/&nbsp;|\s+/g, '').length > 0
}

function allHeadings(): string[] {
  return [...BODY_TEMPLATES, ...REVIEW_TEMPLATES].flatMap((t) => t.headings)
}
