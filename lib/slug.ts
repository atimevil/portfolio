// 제목 → URL slug. 한글은 그대로 살리고(가-힣), 그 외 허용 문자는 영소문자·숫자·하이픈.
// NFC 정규화를 먼저 하는 이유: NFD로 분해된 한글은 자모(U+1100~)라 `가-힣` 범위 밖이고,
// 정규화 전에 문자 필터를 돌리면 통째로 지워진다.
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'post'
}
