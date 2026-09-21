import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { projectSlug } from '@/lib/items'
import { readFigure } from '@/lib/figure'
import { parseMetrics } from '@/lib/caseStudy'
import { localized, type Locale } from '@/lib/i18n'

// 다이어그램이 전부 가로로 긴 그림(약 3:1)이라 좁은 칸에 넣으면 0.3배까지 줄어든다.
// 같은 폭 2열로 두고 그림 칸도 가로로 길게 잡는다.

/**
 * 홈의 작업 격자 — 타일마다 다이어그램, 제목, 결과 한 줄, 대표 수치.
 *
 * 카드 크기에서 다이어그램 글씨는 읽히지 않는다. 그림은 무엇인지 알아보는 얼굴이고
 * 읽는 건 상세에서 한다. 그래서 스크린리더에서는 숨긴다.
 */
export default function SelectedWork({ projects, locale = 'ko' }: { projects: PortfolioItem[]; locale?: Locale }) {
  if (projects.length === 0) return null
  const workBase = locale === 'en' ? '/en/work' : '/work'

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => {
        const figure = readFigure(project.thumbnail)
        const metric = parseMetrics(project.metrics)[0]
        const summary = project.result?.trim() || localized(project, 'description', locale)
        return (
          <li key={project.id}>
            <Link
              href={`${workBase}/${projectSlug(project)}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div
                aria-hidden="true"
                className="fig fig-fill aspect-[16/7] border-b border-border bg-bg-secondary p-4"
                dangerouslySetInnerHTML={figure ? { __html: figure } : undefined}
              />
              <div className="flex flex-1 flex-wrap items-end justify-between gap-x-6 gap-y-3 p-5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-mono text-xs text-text-muted">{project.year}</p>
                  <h3 className="mt-1 text-base font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
                    {localized(project, 'title', locale)}
                  </h3>
                  {summary && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">{summary}</p>
                  )}
                </div>
                {metric && (
                  <div className="shrink-0">
                    <div className="font-mono text-2xl font-medium tracking-tight text-accent">{metric.value}</div>
                    {metric.label && <div className="mt-0.5 max-w-[12rem] text-xs text-text-muted">{metric.label}</div>}
                  </div>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
