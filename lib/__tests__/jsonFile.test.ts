import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { readJsonFile, readJsonFileOr, writeJsonAtomic, CorruptJsonError } from '../jsonFile'

let dir: string
let file: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonfile-'))
  file = path.join(dir, 'data.json')
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('jsonFile', () => {
  it('파일이 없으면 기본값', () => {
    expect(readJsonFile(file, [1])).toEqual([1])
  })

  it('깨진 파일은 예외 — 저장 경로가 빈 값으로 덮어쓰지 않게', () => {
    fs.writeFileSync(file, '{"a": 1,')
    expect(() => readJsonFile(file, {})).toThrow(CorruptJsonError)
  })

  it('표시용 읽기는 깨진 파일이어도 기본값', () => {
    fs.writeFileSync(file, 'nope')
    expect(readJsonFileOr(file, { ok: true })).toEqual({ ok: true })
  })

  it('원자적 쓰기 후 임시 파일이 남지 않고 내용이 맞다', () => {
    writeJsonAtomic(file, { a: 1 })
    writeJsonAtomic(file, { a: 2 })
    expect(readJsonFile(file, {})).toEqual({ a: 2 })
    expect(fs.readdirSync(dir)).toEqual(['data.json'])
  })
})
