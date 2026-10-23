import fs from 'fs'
import path from 'path'
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto'
import { writeJsonAtomic } from '@/lib/jsonFile'

// Stored in the content volume, NOT exposed by any route (unlike settings.json,
// which is public via GET /api/settings). Holds a scrypt hash, never plaintext.
const FILE = path.join(process.cwd(), 'content/auth.json')

function readHash(): string | null {
  if (!fs.existsSync(FILE)) return null
  try {
    return (JSON.parse(fs.readFileSync(FILE, 'utf-8')) as { hash?: string }).hash ?? null
  } catch {
    return null
  }
}

/**
 * Verify a password. Uses the admin-set hash if present; otherwise falls back
 * to the ADMIN_PASSWORD env var so the user is never locked out before setting one.
 */
export function verifyPassword(input: string): boolean {
  const stored = readHash()
  if (!stored) {
    const envPw = process.env.ADMIN_PASSWORD
    if (!envPw || !input) return false
    // 길이가 달라도 같은 시간에 비교하려고 SHA-256 다이제스트끼리 비교한다
    const digest = (v: string) => createHash('sha256').update(v).digest()
    return timingSafeEqual(digest(input), digest(envPw))
  }
  const ok = verifyHash(input, stored)
  // 예전 형식(기본 강도)으로 저장된 해시는 맞았을 때 지금 강도로 다시 저장한다
  if (ok && !stored.startsWith('scrypt$')) setPassword(input)
  return ok
}

// 저장 형식: "scrypt$N$r$p$salt$key". 강도를 해시와 함께 적어 두어 나중에 올려도 예전 해시를 검증할 수 있다.
// 예전 형식 "salt:key"는 Node 기본값(N=16384, r=8, p=1)이다.
// N=2^16, r=8, p=2는 OWASP 권장 조합 중 하나로, 계산 1회에 메모리 64MB를 쓴다(기본 maxmem 32MB라 늘린다).
const PARAMS = { N: 2 ** 16, r: 8, p: 2 }
const MAXMEM = 256 * 1024 * 1024

function verifyHash(input: string, stored: string): boolean {
  let salt: string, key: string, opts: { N: number; r: number; p: number }
  if (stored.startsWith('scrypt$')) {
    const [, n, r, p, s, k] = stored.split('$')
    opts = { N: Number(n), r: Number(r), p: Number(p) }
    salt = s
    key = k
  } else {
    ;[salt, key] = stored.split(':')
    opts = { N: 16384, r: 8, p: 1 }
  }
  if (!salt || !key) return false
  try {
    const derived = scryptSync(input, salt, 64, { ...opts, maxmem: MAXMEM })
    const expected = Buffer.from(key, 'hex')
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** Hash and persist a new admin password (overwrites any env fallback). */
export function setPassword(newPassword: string): void {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(newPassword, salt, 64, { ...PARAMS, maxmem: MAXMEM }).toString('hex')
  writeJsonAtomic(FILE, { hash: `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt}$${key}` })
}
