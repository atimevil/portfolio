// 요약 칸을 비워두고 저장할 때 본문 HTML 앞부분으로 요약을 만든다.
// 접기 버튼 글자(<summary>, 티스토리 '더보기')와 코드 블록(<pre>)은 요약에 넣지 않는다 — 코드가 섞이면 목록에서 읽을 수 없다.
// 제목(<h1>~<h6>)도 뺀다 — 첫 줄이 제목이면 요약이 제목 반복("Lazy Loading Lazy Loading은…")으로 시작한다.
export function excerptFromHtml(html: string, max = 150): string {
  return html
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, ' ')
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// 마크다운 글의 요약이 비어 있을 때 본문에서 요약 재료를 고른다(이후 stripMarkdown으로 기호를 벗긴다).
// 제목 줄과 "목차" 절(목차 제목부터 다음 제목 전까지의 목록)을 뺀다 — 안 빼면 "목차 동적 계획법이란 Top-Down…"처럼 나온다.
export function markdownExcerptSource(md: string): string {
  return md
    .replace(/^[ \t]*#{1,6}[ \t]*[*_]*[ \t]*목차[\s\S]*?(?=^[ \t]*#{1,6}[ \t]|(?![\s\S]))/m, '')
    .replace(/^[ \t]*#{1,6}[ \t].*$/gm, '')
}
