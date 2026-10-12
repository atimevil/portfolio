import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { scryptSync } from 'crypto'

// auth-password는 process.cwd()/content/auth.json을 쓰므로 임시 폴더에서 모듈을 새로 불러온다
let dir: string
const cwd = process.cwd()
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'authpw-'))
  fs.mkdirSync(path.join(dir, 'content'))
  process.chdir(dir)
  vi.resetModules()
})
afterEach(() => {
  process.chdir(cwd)
  fs.rmSync(dir, { recursive: true, force: true })
})
const load = () => import('@/lib/auth-password')
const stored = () => JSON.parse(fs.readFileSync(path.join(dir, 'content/auth.json'), 'utf-8')).hash as string

describe('auth-password', () => {
  it('새 비밀번호는 강도를 함께 적어 저장하고 검증한다', async () => {
    const { setPassword, verifyPassword } = await load()
    setPassword('correct horse battery')
    expect(stored()).toMatch(/^scrypt\$65536\$8\$2\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(verifyPassword('correct horse battery')).toBe(true)
    expect(verifyPassword('wrong')).toBe(false)
  })

  it('예전 형식 해시도 검증하고, 맞으면 새 형식으로 바꿔 저장한다', async () => {
    const salt = 'a'.repeat(32)
    const old = `${salt}:${scryptSync('legacy-pass', salt, 64).toString('hex')}`
    fs.writeFileSync(path.join(dir, 'content/auth.json'), JSON.stringify({ hash: old }))
    const { verifyPassword } = await load()
    expect(verifyPassword('nope')).toBe(false)
    expect(stored()).toBe(old)
    expect(verifyPassword('legacy-pass')).toBe(true)
    expect(stored()).toMatch(/^scrypt\$/)
    expect(verifyPassword('legacy-pass')).toBe(true)
  })
})
