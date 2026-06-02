export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import TimelineItem from '@/components/about/TimelineItem'

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

  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  const hasEvents = timeline.length > 0

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* 메인: 프로필 + 프로젝트 */}
        <div className="flex-1 min-w-0">
          <section className="mb-10 pb-10 border-b border-border flex gap-6 items-start">
            <div className="w-20 h-20 rounded-full bg-surface border border-border overflow-hidden shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-text-muted">👤</div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-2">{profile.name}</h1>
              <p className="text-sm text-text-secondary mb-3 whitespace-pre-line">
                {profile.aboutText || profile.bio}
              </p>
              <div className="flex gap-4 text-xs text-text-muted">
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="hover:text-text-primary transition-colors">GitHub</a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="hover:text-text-primary transition-colors">LinkedIn</a>
                )}
              </div>
            </div>
          </section>

          {projects.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-5">프로젝트</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => {
                  const href = project.github || project.link
                  const Card = (
                    <div className={`border border-border rounded-lg p-4 bg-bg-secondary h-full flex flex-col ${href ? 'hover:border-text-muted transition-colors cursor-pointer' : ''}`}>
                      {project.thumbnail && (
                        <img src={project.thumbnail} alt={project.title}
                          className="w-full h-32 object-cover rounded-md mb-3 bg-surface" />
                      )}
                      <h3 className="font-semibold text-text-primary text-sm mb-1">{project.title}</h3>
                      <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {project.skills?.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded bg-surface text-text-muted">{s}</span>
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
        </div>

        {/* 오른쪽: 활동 & 수상 */}
        {hasEvents && (
          <aside className="w-full lg:w-52 shrink-0 border-t border-border pt-8 lg:border-t-0 lg:pt-0">
            <div className="lg:sticky lg:top-20">
              <h2 className="text-sm font-semibold text-text-primary mb-5">활동 & 수상</h2>
              <div className="relative pl-5">
                <div className="absolute left-[4px] top-1 bottom-1 w-px bg-border" />
                {timeline.map((item) => (
                  <TimelineItem
                    key={item.id}
                    year={item.year}
                    type={item.type === 'project' ? '프로젝트' : item.type === 'award' ? '수상' : '활동'}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>
            </div>
          </aside>
        )}

      </div>
    </main>
  )
}
