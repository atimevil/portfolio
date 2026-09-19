import Link from 'next/link'
import { getProjects } from '@/lib/items'
import { t, localized, type Locale } from '@/lib/i18n'

/** 홈에 띄울 개수. 나머지는 /about에서 본다. */
const HOME_COUNT = 3
/** 카드 한 장에 보여줄 스킬 개수. 넘치면 "+N"으로 접는다. */
const SKILL_COUNT = 4

/**
 * 홈 상단의 주요 작업 3개.
 *
 * 방문자가 처음 보는 화면이 알고리즘 문제풀이 목록이면 무엇을 하는 사람인지 알 수 없다.
 * /about 카드와 달리 설명을 2줄로 자르고 썸네일을 빼서, 훑어보는 용도로만 쓴다.
 */
export default function SelectedWork({ locale = 'ko' }: { locale?: Locale }) {
  const projects = getProjects().slice(0, HOME_COUNT)
  if (projects.length === 0) return null

  const aboutHref = locale === 'en' ? '/en/about' : '/about'

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t(locale, 'selectedWork')}
        </h2>
        <Link
          href={aboutHref}
          className="inline-flex min-h-[24px] items-center text-xs text-text-secondary transition-colors hover:text-accent"
        >
          {t(locale, 'viewAllWork')}
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {projects.map((project) => {
          const href = project.github || project.link
          const title = localized(project, 'title', locale)
          const skills = project.skills ?? []
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
                  {title}
                </h3>
                {project.year && (
                  <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                {localized(project, 'description', locale)}
              </p>
              {skills.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {skills.slice(0, SKILL_COUNT).map((s) => (
                    <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                      {s}
                    </span>
                  ))}
                  {skills.length > SKILL_COUNT && (
                    <span className="px-1 py-0.5 text-xs text-text-secondary">
                      +{skills.length - SKILL_COUNT}
                    </span>
                  )}
                </div>
              )}
            </>
          )

          return (
            <li key={project.id}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {body}
                </a>
              ) : (
                <div className="rounded-xl border border-border bg-bg-secondary p-4">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
