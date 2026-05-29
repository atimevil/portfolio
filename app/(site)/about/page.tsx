export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { getProjects } from '@/lib/projects'

export default async function AboutPage() {
  const settings = getSettings()
  const projects = getProjects()
  const { profile } = settings

  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  const hasEvents = profile.activities.length > 0 || profile.awards.length > 0
  const events = [
    ...profile.activities.map((a) => ({ ...a, type: '활동' as const })),
    ...profile.awards.map((a) => ({ ...a, type: '수상' as const })),
  ].sort((a, b) => b.year.localeCompare(a.year))

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <div className="flex gap-10">

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
                {projects.map((project) => (
                  <div key={project.id}
                    className="border border-border rounded-lg p-4 bg-bg-secondary">
                    {project.thumbnail && (
                      <img src={project.thumbnail} alt={project.name}
                        className="w-full h-32 object-cover rounded-md mb-3 bg-surface" />
                    )}
                    <h3 className="font-semibold text-text-primary text-sm mb-1">{project.name}</h3>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.skills.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded bg-surface text-text-muted">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted">
                      {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer"
                          className="hover:text-text-primary transition-colors">GitHub</a>
                      )}
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer"
                          className="hover:text-text-primary transition-colors">링크 →</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 오른쪽: 활동 & 수상 */}
        {hasEvents && (
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20">
              <h2 className="text-sm font-semibold text-text-primary mb-5">활동 & 수상</h2>
              <div className="relative pl-5">
                <div className="absolute left-[4px] top-1 bottom-1 w-px bg-border" />
                {events.map((item, i) => (
                  <div key={i} className="relative mb-5 last:mb-0">
                    <div className="absolute -left-5 top-[5px] w-[9px] h-[9px] rounded-full bg-bg border-2 border-border" />
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-text-muted tabular-nums">{item.year}</span>
                      <span className="text-[9px] text-text-muted border border-border rounded px-1 py-px leading-none">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary leading-snug">{item.title}</p>
                    {item.description && (
                      <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

      </div>
    </main>
  )
}
