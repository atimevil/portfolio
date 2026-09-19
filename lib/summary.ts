/**
 * 긴 설명을 "요약 + 나머지"로 가른다.
 *
 * 프로젝트 설명은 짧게는 77자, 길게는 500자에 가깝다. 긴 쪽을 그대로 펼쳐두면
 * 카드가 글 벽이 되어 훑어볼 수가 없으므로, limit 이내의 마지막 문장 경계에서 자른다.
 * 문장 중간에서 자르면 읽다 만 느낌이 나므로 경계를 못 찾으면 아예 나누지 않는다.
 */
export function splitSummary(text: string, limit = 200): { summary: string; rest: string } {
  const full = text.trim()
  if (full.length <= limit) return { summary: full, rest: '' }

  // limit 이내에서 마지막 문장 끝(마침표/물음표/느낌표 + 공백)을 찾는다.
  const head = full.slice(0, limit + 1)
  const boundary = /[.!?]\s/g
  let cut = -1
  let m: RegExpExecArray | null
  while ((m = boundary.exec(head)) !== null) {
    cut = m.index + 1
  }
  if (cut <= 0) return { summary: full, rest: '' }

  return { summary: full.slice(0, cut).trim(), rest: full.slice(cut).trim() }
}
