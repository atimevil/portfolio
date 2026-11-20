// 갤러리 사진을 단에 번갈아 나눈다(0번→1단, 1번→2단, …).
// CSS columns는 1단을 위에서 아래로 다 채운 뒤 2단으로 넘어가서, 줄을 따라 읽으면 날짜가 뒤섞여 보였다.
// 이렇게 나누면 맨 윗줄에 가장 최근 사진들이 오고, 왼쪽→오른쪽·위→아래로 읽는 순서가 목록 순서와 같다.
export function distributeColumns<T>(items: T[], columns: number): T[][] {
  const n = Math.max(1, Math.floor(columns))
  const cols: T[][] = Array.from({ length: n }, () => [])
  items.forEach((item, i) => cols[i % n].push(item))
  return cols
}
