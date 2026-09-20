import Link from 'next/link'
import { getProjects, projectSlug } from '@/lib/items'
import { t, localized, type Locale } from '@/lib/i18n'

/** 홈에 띄울 개수. 나머지는 /about에서 본다. */
const HOME_COUNT = 3
/** 한 줄에 늘어놓을 스킬 개수. 넘치면 "+N"으로 접는다. */
const SKILL_COUNT = 3

/**
 * 홈 상단의 주요 작업 3개.
 *
 * 방문자가 처음 보는 화면이 알고리즘 문제풀이 목록이면 무엇을 하는 사람인지 알 수 없다.
 * 다만 여기서 설명까지 읽히려 들면 블로그 목록이 첫 화면 밖으로 밀려나므로,
 * "무엇을 / 언제 / 무엇으로"만 남기고 자세한 건 /about으로 보낸다.
 */
export default function SelectedWork({ locale = 'ko' }: { locale?: Locale }) {
  const projects = getProjects().slice(0, HOME_COUNT)
  if (projects.length === 0) return null

  const aboutHref = locale === 'en' ? '/en/about' : '/about'

  return (
    <section className="mb-8">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
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

      <ul className="flex flex-col">
        {projects.map((project) => {
          // 예전엔 GitHub으로 바로 나갔다. 이제 상세 페이지가 있으니 사이트 안에 머문다.
          const href = `${locale === 'en' ? '/en/work' : '/work'}/${projectSlug(project)}`
          const title = localized(project, 'title', locale)
          const skills = project.skills ?? []

          return (
            <li key={project.id} className="border-b border-border py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold leading-snug text-text-primary">
                  <Link
                    href={href}
                    className="rounded-sm transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {title}
                  </Link>
                </h3>
                {project.year && (
                  <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                )}
              </div>
              {/* 홈이 가장 많이 보이는 화면인데 주제와 기술만 있고 성과가 없었다.
                  결과 한 줄을 넣어 "무엇을 이뤘나"가 먼저 읽히게 한다. */}
              {(project.result?.trim() || localized(project, 'description', locale)) && (
                <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-text-secondary">
                  {project.result?.trim() || localized(project, 'description', locale)}
                </p>
              )}
              {skills.length > 0 && (
                <p className="mt-1 text-xs text-text-secondary">
                  {skills.slice(0, SKILL_COUNT).join(' · ')}
                  {skills.length > SKILL_COUNT && ` +${skills.length - SKILL_COUNT}`}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
