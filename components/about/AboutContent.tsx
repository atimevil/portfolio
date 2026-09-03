import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline } from '@/lib/items'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'
import { t, localized, type Locale } from '@/lib/i18n'

/** 한국어(/about) · 영문(/en/about)이 공유하는 소개 본문. */
export default function AboutContent({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const projects = getProjects()
  const timeline = getTimeline()
  const hasEvents = timeline.length > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <ProfileHeader profile={profile} locale={locale} />

      {projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">
            {t(locale, 'projects')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const href = project.github || project.link
              const title = localized(project, 'title', locale)
              const Card = (
                <div className={`group h-full flex flex-col rounded-xl border border-border bg-bg-secondary p-5 transition-all ${href ? 'hover:border-accent hover:-translate-y-0.5 cursor-pointer' : ''}`}>
                  {project.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.thumbnail} alt={title}
                      className="w-full h-32 object-cover rounded-lg mb-3 bg-surface" />
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold text-[15px] text-text-primary transition-colors group-hover:text-accent-hover">
                      {title}
                    </h3>
                    {project.year && (
                      <span className="shrink-0 font-mono text-[11px] text-text-muted">{project.year}</span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-text-secondary mt-2 mb-4">
                    {localized(project, 'description', locale)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.skills?.map((s) => (
                      <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">{s}</span>
                    ))}
                  </div>
                  {/* 카드 전체가 링크지만 눈에 보이는 단서가 없으면 클릭 가능한지 알 수 없다.
                      중첩 <a>는 안 되므로 목적지를 span으로만 표시한다. */}
                  {href && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-text-muted transition-colors group-hover:text-accent">
                      <span>{project.github ? 'GitHub' : locale === 'en' ? 'Website' : '사이트'}</span>
                      <span aria-hidden>↗</span>
                    </div>
                  )}
                </div>
              )
              return href ? (
                <a key={project.id} href={href} target="_blank" rel="noopener noreferrer">
                  {Card}
                </a>
              ) : (
                <div key={project.id}>{Card}</div>
              )
            })}
          </div>
        </section>
      )}

      {/* 활동 & 수상 — 간결한 목록 */}
      {hasEvents && (
        <AwardsGantt items={timeline.filter((i) => i.type !== 'project')} locale={locale} />
      )}
    </main>
  )
}
