import { ipKey } from '@/lib/rate-limit'

// 같은 방문자가 같은 글을 다시 열거나 새로 고쳐도 조회수는 한 번만 센다(창 6시간).
// 조회수 API는 로그인 없이 부르므로, 이게 없으면 주소 하나를 반복 호출해 숫자를 마음대로 올릴 수 있다.
// 단일 인스턴스 메모리 보관(재시작하면 초기화) — lib/rate-limit과 같은 방식이다. 방문자 구분은 IP(IPv6는 /64)다.
const WINDOW_MS = 6 * 60 * 60 * 1000
const MAX_ENTRIES = 20_000

// key → 만료 시각. Map은 넣은 순서를 지키므로 앞쪽이 오래된 것이다.
const seen = new Map<string, number>()

/** 이 방문자의 이 글 조회를 세어야 하면 true(그리고 기억해 둔다). 창 안에서 다시 오면 false. */
export function shouldCountView(ip: string, slug: string, now: number = Date.now()): boolean {
  const key = `${ipKey(ip)}|${slug}`
  const until = seen.get(key)
  if (until !== undefined && until > now) return false

  seen.delete(key) // 다시 넣어 순서를 맨 뒤로
  seen.set(key, now + WINDOW_MS)
  if (seen.size > MAX_ENTRIES) prune(now)
  return true
}

// 만료된 것을 지우고, 그래도 넘치면 오래된 것부터 지운다(메모리가 끝없이 늘지 않게).
function prune(now: number): void {
  for (const [key, until] of seen) {
    if (until <= now) seen.delete(key)
  }
  for (const key of seen.keys()) {
    if (seen.size <= MAX_ENTRIES) break
    seen.delete(key)
  }
}

/** 테스트용 */
export function resetViewDedupe(): void {
  seen.clear()
}
