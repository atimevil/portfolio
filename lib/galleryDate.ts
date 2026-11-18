// 갤러리 사진의 날짜(상장 받은 날, 찍은 날). 화면의 "2025.11" 표시와 정렬이 이 값을 쓴다.
// 관리자가 고른 YYYY-MM-DD를 한국 시간 정오로 저장한다 — 자정으로 두면 시간대에 따라 하루·한 달이 밀릴 수 있다.
export function galleryDateToCreatedAt(date: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(Date.UTC(y, mo - 1, d, 3)) // 03:00 UTC = 12:00 KST
  // 2025-02-30처럼 없는 날짜는 Date가 다음 달로 넘겨 버리므로 되돌려 확인한다
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null
  return t.toISOString()
}
