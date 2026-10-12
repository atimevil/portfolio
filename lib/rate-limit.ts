// 로그인 무차별 대입 방지 (단일 인스턴스 in-memory; 재시작 시 초기화).
// IP당 WINDOW_MS 안에 MAX_FAILS회 실패하면 LOCK_MS 동안 잠금.
type Record = { count: number; windowEnd: number; lockedUntil: number }

const store = new Map<string, Record>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000

// IPv6는 한 가입자가 /64 대역(주소 2^64개)을 통째로 받으므로, 주소마다 세면 주소를 바꿔 가며 제한을 피한다.
// IPv6는 앞 64비트(/64)를 한 키로 묶는다. IPv4-mapped(::ffff:1.2.3.4)는 IPv4로 본다.
export function ipKey(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  if (mapped) return mapped[1]
  if (!ip.includes(':')) return ip
  const [head, tail = ''] = ip.toLowerCase().split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  const groups = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`
}

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
