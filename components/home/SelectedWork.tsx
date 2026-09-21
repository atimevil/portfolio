import Link from 'next/link'
import { getProjects, projectSlug } from '@/lib/items'
import { readFigure } from '@/lib/figure'
import { localized, type Locale } from '@/lib/i18n'

/** 홈에 띄울 개수. 나머지는 /about에서 본다. */
const HOME_COUNT = 3

/**
 * 홈의 주요 작업 카드 3장 — 위에 제목, 아래에 그림.
 *
 * 카드 크기에서 다이어그램 글씨는 읽히지 않는다. 여기서 그림은 무엇인지 알아보는
 * 얼굴 역할이고, 읽는 건 상세 페이지에서 한다. 그래서 스크린리더에서는 숨긴다
 * (카드 링크 이름에 긴 그림 설명이 통째로 붙지 않게).
 */
export default function SelectedWork({ locale = 'ko' }: { locale?: Locale }) {
  const projects = getProjects().slice(0, HOME_COUNT)
  if (projects.length === 0) return null
  const workBase = locale === 'en' ? '/en/work' : '/work'

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const figure = readFigure(project.thumbnail)
        const meta = [project.year, ...(project.skills ?? []).slice(0, 2)].filter(Boolean).join(' · ')
        return (
          <li key={project.id}>
            <Link
              href={`${workBase}/${projectSlug(project)}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-bg transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="p-4">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
                  {localized(project, 'title', locale)}
                </h3>
                {meta && <p className="mt-1 text-xs text-text-secondary">{meta}</p>}
              </div>
              <div
                aria-hidden="true"
                className="fig fig-fill mt-auto aspect-[16/10] border-t border-border bg-bg-secondary p-3"
                dangerouslySetInnerHTML={figure ? { __html: figure } : undefined}
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
