import { describe, it, expect, vi, beforeEach } from 'vitest'

const files: Record<string, unknown> = {}
let statsMtime: Date | null = null
vi.mock('@/lib/jsonFile', () => ({
  readJsonFileOr: (file: string, fallback: unknown) => {
    const key = Object.keys(files).find((k) => file.endsWith(k))
    return key ? files[key] : fallback
  },
}))
vi.mock('fs', () => ({
  default: {
    statSync: () => {
      if (!statsMtime) throw Object.assign(new Error('nope'), { code: 'ENOENT' })
      return { mtime: statsMtime }
    },
  },
}))

import { getOpsWarnings } from '../opsStatus'

const NOW = new Date('2026-10-12T12:00:00Z')
beforeEach(() => {
  for (const k of Object.keys(files)) delete files[k]
  statsMtime = new Date('2026-10-12T05:30:00Z')
})

describe('getOpsWarnings', () => {
  it('최근 백업 성공·통계 갱신이면 경고 없음', () => {
    files['ops/backup.json'] = { at: '2026-10-12T00:00:00Z', ok: true }
    files['ops/backup-ok.json'] = { at: '2026-10-12T00:00:00Z', ok: true }
    expect(getOpsWarnings(NOW)).toEqual([])
  })

  it('마지막 백업 실패와 오래된 성공 기록을 알린다', () => {
    files['ops/backup.json'] = { at: '2026-10-12T00:00:00Z', ok: false }
    files['ops/backup-ok.json'] = { at: '2026-09-28T00:00:00Z', ok: true }
    expect(getOpsWarnings(NOW).map((w) => w.key)).toEqual(['backup-failed', 'backup-stale'])
  })

  it('성공 기록이 없거나 통계가 2일 넘게 안 바뀌면 알린다', () => {
    statsMtime = new Date('2026-10-09T05:30:00Z')
    expect(getOpsWarnings(NOW).map((w) => w.key)).toEqual(['backup-none', 'stats-stale'])
  })
})
