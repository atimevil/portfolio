import Link from 'next/link'
import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline, projectSlug, timeKey } from '@/lib/items'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'
import { hasCaseStudy } from '@/lib/caseStudy'
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

  // 케이스 스터디가 채워진 것을 먼저(손으로 고른 order), 나머지는 최신순.
  const all = getProjects()
  const projects = [
    ...all.filter(hasCaseStudy),
    ...all.filter((p) => !hasCaseStudy(p)).sort((a, b) => timeKey(b.year) - timeKey(a.year)),
  ]
  const events = getTimeline().filter((i) => i.type !== 'project')

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{t(locale, 'about')}</h1>
      </header>

      <ProfileHeader profile={profile} locale={locale} headingLevel={2} />

      {projects.length > 0 && (
        <section>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
            {t(locale, 'projects')}
          </h2>
          <ul className="flex flex-col">
            {projects.map((project) => {
              const title = localized(project, 'title', locale)
              const skills = project.skills ?? []
              return (
                <li key={project.id} className="border-b border-border py-4 last:border-b-0">
                  <Link
                    href={`${workBase}/${projectSlug(project)}`}
                    className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
                        {title}
                      </h3>
                      {project.year && (
                        <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                      {project.result?.trim() || localized(project, 'description', locale)}
                    </p>
                    {skills.length > 0 && (
                      <p className="mt-2 text-xs text-text-secondary">{skills.slice(0, 5).join(' · ')}</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {events.length > 0 && <AwardsGantt items={events} locale={locale} />}
    </main>
  )
}
