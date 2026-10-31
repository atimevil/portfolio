import type { PortfolioItem } from '@/types'
import { parseMetrics } from '@/lib/caseStudy'
import { applyGithubStats } from '@/lib/githubStats'
import { localized, type Locale } from '@/lib/i18n'

/**
 * 제목에 부제가 붙어 있으면 이름과 한 줄 설명으로 나눈다.
 * 한국어는 "가치해봄 — 첫 참가자 팀 매칭 서비스", 영문은 "Gachi Haebom: Team matching …" 꼴로 적혀 있다.
 */
export function splitTitle(project: PortfolioItem, locale: Locale): { name: string; line: string } {
  const title = localized(project, 'title', locale)
  const m = title.match(/\s—\s|:\s/)
  if (m?.index) return { name: title.slice(0, m.index), line: title.slice(m.index + m[0].length) }
  return { name: title, line: '' }
}

/**
 * 카드에 붙는 두 줄: 밖에서 확인되는 결과, 내 역할.
 * withMetricFallback이면 결과를 안 적은 작업은 지표 첫 줄로 대신한다(홈처럼 자리를 꼭 채워야 할 때).
 */
export function outcome(
  project: PortfolioItem,
  locale: Locale,
  withMetricFallback = false,
): { highlight: string; role: string } {
  const role = localized(project, 'role', locale).trim()
  const highlight = localized(project, 'highlight', locale).trim()
  if (highlight || !withMetricFallback) return { highlight, role }
  const metric = parseMetrics(applyGithubStats(localized(project, 'metrics', locale), project.github))[0]
  return { highlight: metric ? [metric.value, metric.label].filter(Boolean).join(' · ') : '', role }
}
