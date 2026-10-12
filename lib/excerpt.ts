// 요약 칸을 비워두고 저장할 때 본문 HTML 앞부분으로 요약을 만든다.
// 접기 버튼 글자(<summary>, 티스토리 '더보기')와 코드 블록(<pre>)은 요약에 넣지 않는다 — 코드가 섞이면 목록에서 읽을 수 없다.
export function excerptFromHtml(html: string, max = 150): string {
  return html
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, ' ')
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
