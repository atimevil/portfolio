import fs from 'fs'
import path from 'path'
import { readJsonFileOr } from '@/lib/jsonFile'

// 서버 작업(주간 백업·GitHub 통계 수집)이 실패해도 알려줄 채널이 없다. 각 작업이 content/에 남긴
// 흔적을 어드민 대시보드가 읽어서, 실패했거나 너무 오래 안 돌았으면 경고를 띄운다.
//  - 백업: scripts/backup.sh가 content/ops/backup.json(매번)·backup-ok.json(성공 시)을 쓴다
//  - GitHub 통계: scripts/fetch-github-stats.mjs가 매일 content/github-stats.json을 갱신한다(수정 시각으로 판단)

const DIR = path.join(process.cwd(), 'content')
const DAY = 24 * 60 * 60 * 1000
const BACKUP_MAX_AGE = 8 * DAY // 주 1회 + 여유 하루
const STATS_MAX_AGE = 2 * DAY // 매일 + 여유 하루

export interface OpsWarning {
  key: string
  message: string
}

type RunRecord = { at?: string; ok?: boolean }

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export function getOpsWarnings(now: Date = new Date()): OpsWarning[] {
  const warnings: OpsWarning[] = []

  const last = readJsonFileOr<RunRecord>(path.join(DIR, 'ops/backup.json'), {})
  const lastOk = readJsonFileOr<RunRecord>(path.join(DIR, 'ops/backup-ok.json'), {})
  if (last.at && last.ok === false) {
    warnings.push({ key: 'backup-failed', message: `주간 백업이 실패했습니다 (${fmt(new Date(last.at))}). 서버에서 journalctl -u portfolio-backup 을 확인하세요.` })
  }
  if (!lastOk.at) {
    warnings.push({ key: 'backup-none', message: '성공한 백업 기록이 없습니다.' })
  } else if (now.getTime() - new Date(lastOk.at).getTime() > BACKUP_MAX_AGE) {
    warnings.push({ key: 'backup-stale', message: `마지막으로 성공한 백업이 ${fmt(new Date(lastOk.at))}입니다 (8일 넘음).` })
  }

  try {
    const mtime = fs.statSync(path.join(DIR, 'github-stats.json')).mtime
    if (now.getTime() - mtime.getTime() > STATS_MAX_AGE) {
      warnings.push({ key: 'stats-stale', message: `GitHub 별·포크 수가 ${fmt(mtime)} 이후 갱신되지 않았습니다. ~/logs/gh-stats.log 를 확인하세요.` })
    }
  } catch {
    // 파일이 없으면 프로젝트 카드는 적어둔 값을 쓴다 — 경고까지는 아니다
  }

  return warnings
}
