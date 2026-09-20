import type { PortfolioItem } from '@/types'
import { t, type Locale } from '@/lib/i18n'

export interface ProjectLink {
  label: string
  href: string
}

/**
 * 프로젝트의 바깥 목적지를 라벨과 함께 모은다.
 *
 * 연구 프로젝트는 결과물이 저장소가 아니라 논문이라 paper를 먼저 둔다.
 * 링크가 하나뿐이면 제목에 걸고, 둘 이상이면 아래에 나란히 둔다(호출부 판단).
 */
export function projectLinks(item: PortfolioItem, locale: Locale): ProjectLink[] {
  return [
    { label: t(locale, 'linkPaper'), href: item.paper },
    { label: 'GitHub', href: item.github },
    { label: t(locale, 'linkSite'), href: item.link },
  ].filter((l): l is ProjectLink => Boolean(l.href?.trim()))
}
