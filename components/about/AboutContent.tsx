import Link from 'next/link'
import { getSettings } from '@/lib/settings'
import { getOrderedProjects, getTimeline, projectSlug } from '@/lib/items'
import { splitTitle, outcome } from '@/lib/projectCard'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'
import OpenTargetDetails from '@/components/about/OpenTargetDetails'
import { t, localized, type Locale } from '@/lib/i18n'

/**
 * 소개(/about · /en/about).
 *
 * 케이스 스터디·지표·그림 같은 깊은 내용은 /work/<slug>가 맡는다. 여기서는
 * "누구이고 무엇을 만들었나"만 목록으로 보여주고 상세로 보낸다.
 * 이력서에 적힌 주소라 URL은 바꾸지 않는다.
 */
export default function AboutContent({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const workBase = locale === 'en' ? '/en/work' : '/work'

  // 상세의 이전/다음도 같은 함수를 쓴다 — 목록 순서와 어긋나면 안 된다.
  const projects = getOrderedProjects()
  const events = getTimeline().filter((i) => i.type !== 'project')

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        <h1 className="page-title">{t(locale, 'about')}</h1>
      </header>

      <ProfileHeader profile={profile} locale={locale} headingLevel={2} />

      {projects.length > 0 && (
        <section id="projects" className="scroll-mt-24">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
            {t(locale, 'projects')}
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const { name, line } = splitTitle(project, locale)
              const { highlight, role } = outcome(project, locale)
              const skills = project.skills ?? []
              return (
                <li key={project.id}>
                  <Link
                    href={`${workBase}/${projectSlug(project)}`}
                    className="group flex h-full flex-col tile transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-semibold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-accent-hover">
                          {name}
                        </h3>
                        {project.year && (
                          <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                        )}
                      </div>
                      {line && <p className="mt-1 text-sm text-text-secondary">{line}</p>}
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                        {localized(project, 'result', locale).trim() || localized(project, 'description', locale)}
                      </p>
                      {/* 결과·역할을 적은 작업은 그 두 줄을, 아니면 기술 스택을 아래에 둔다 */}
                      {highlight || role ? (
                        <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 pt-4">
                          {highlight && <span className="text-sm font-semibold text-text-primary">{highlight}</span>}
                          {role && <span className="text-xs text-text-secondary">{role}</span>}
                        </p>
                      ) : (
                        skills.length > 0 && <p className="mt-auto pt-4 text-xs text-text-secondary">{skills.slice(0, 4).join(' · ')}</p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {events.length > 0 && <AwardsGantt items={events} locale={locale} />}
      <OpenTargetDetails />
    </main>
  )
}
