import fs from 'fs'
import path from 'path'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

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
    return !!envPw && !!input && input === envPw
  }
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  try {
    const derived = scryptSync(input, salt, 64)
    const expected = Buffer.from(key, 'hex')
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** Hash and persist a new admin password (overwrites any env fallback). */
export function setPassword(newPassword: string): void {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(newPassword, salt, 64).toString('hex')
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify({ hash: `${salt}:${key}` }, null, 2), 'utf-8')
}
