// 로그인 무차별 대입 방지 (단일 인스턴스 in-memory; 재시작 시 초기화).
// IP당 WINDOW_MS 안에 MAX_FAILS회 실패하면 LOCK_MS 동안 잠금.
type Record = { count: number; windowEnd: number; lockedUntil: number }

const store = new Map<string, Record>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000

export function isLocked(key: string): boolean {
  const r = store.get(key)
  return !!r && r.lockedUntil > Date.now()
}

export function recordFailure(key: string): void {
  const now = Date.now()
  let r = store.get(key)
  if (!r || r.windowEnd < now) r = { count: 0, windowEnd: now + WINDOW_MS, lockedUntil: 0 }
  r.count += 1
  if (r.count >= MAX_FAILS) r.lockedUntil = now + LOCK_MS
  store.set(key, r)
}

export function recordSuccess(key: string): void {
  store.delete(key)
}
