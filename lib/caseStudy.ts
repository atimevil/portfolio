import type { PortfolioItem } from '@/types'

/** 한 카드에 늘어놓을 지표 개수. 넘치면 잘라 레이아웃이 무너지지 않게 한다. */
const MAX_METRICS = 4

export interface Metric {
  value: string
  label: string
}

/** 셋 중 하나라도 채워져 있으면 케이스 스터디로 그린다. */
export function hasCaseStudy(item: PortfolioItem): boolean {
  return Boolean(item.problem?.trim() || item.contribution?.trim() || item.result?.trim())
}

/**
 * 지표 입력을 파싱한다. 한 줄에 하나, "값 | 라벨".
 *
 *   0.84 → 0.87 | 금융 테스트셋 Macro-F1
 *   617,611      | 65만 건에서 정제한 리뷰
 *
 * 구분자가 없으면 값만 있는 것으로 보고 라벨은 비운다. 값이 빈 줄은 버린다.
 */
export function parseMetrics(raw?: string): Metric[] {
  if (!raw) return []
  const out: Metric[] = []
  for (const line of raw.split('\n')) {
    const sep = line.indexOf('|')
    const value = (sep === -1 ? line : line.slice(0, sep)).trim()
    if (!value) continue
    out.push({ value, label: sep === -1 ? '' : line.slice(sep + 1).trim() })
    if (out.length === MAX_METRICS) break
  }
  return out
}
