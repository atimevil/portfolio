// 글 날짜 기본값. toISOString()은 UTC라 한국 시간 0~9시에 쓰면 전날 날짜가 됐다.
// 사이트 주인이 한국에 있으니 서울 기준 날짜(YYYY-MM-DD)를 쓴다(브라우저 시간대와 무관).
export function todayKST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now)
}
