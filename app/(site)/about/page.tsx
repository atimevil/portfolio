export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  return buildPageMetadata({
    path: '/about',
    title: '소개',
    description: `${name}의 프로젝트, 기술 스택, 활동 및 수상 내역`,
  })
}

export default async function AboutPage() {
  const settings = getSettings()
  const projects = getProjects()
  const timeline = getTimeline()
  const { profile } = settings
  const hasEvents = timeline.length > 0

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <ProfileHeader profile={profile} />

      {projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const href = project.github || project.link
              const Card = (
                <div className={`group h-full flex flex-col rounded-xl border border-border bg-bg-secondary p-5 transition-all ${href ? 'hover:border-accent hover:-translate-y-0.5 cursor-pointer' : ''}`}>
                  {project.thumbnail && (
                    <img src={project.thumbnail} alt={project.title}
                      className="w-full h-32 object-cover rounded-lg mb-3 bg-surface" />
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold text-[15px] text-text-primary transition-colors group-hover:text-accent-hover">
                      {project.title}
                    </h3>
                    {project.year && (
                      <span className="shrink-0 font-mono text-[11px] text-text-muted">{project.year}</span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-text-secondary mt-2 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.skills?.map((s) => (
                      <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">{s}</span>
                    ))}
                  </div>
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

      {/* 활동 & 수상 — 가로 간트 (기간 시각화) */}
      {hasEvents && <AwardsGantt items={timeline.filter((i) => i.type !== 'project')} />}
    </main>
  )
}
