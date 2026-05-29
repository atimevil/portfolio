import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import { getSettings } from '@/lib/settings'
import { getProjects } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const settings = getSettings()
  const projects = getProjects()
  const { profile } = settings

  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-12">
        {/* 프로필 */}
        <section className="flex gap-8 items-start mb-12 pb-12 border-b border-border">
          <div className="w-24 h-24 rounded-full bg-surface border border-border overflow-hidden shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-text-muted">👤</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{profile.name}</h1>
            <p className="text-text-secondary mb-4 whitespace-pre-line">{profile.aboutText || profile.bio}</p>
            <div className="flex gap-4 text-sm text-text-muted">
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

        {/* 프로젝트 + 활동·수상 2컬럼 */}
        <section className="flex flex-col lg:flex-row gap-12">

          {/* 왼쪽: 프로젝트 */}
          {projects.length > 0 && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text-primary mb-6">프로젝트</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {projects.map((project) => (
                  <div key={project.id}
                    className="border border-border rounded-lg p-5 bg-bg-secondary">
                    {project.thumbnail && (
                      <img src={project.thumbnail} alt={project.name}
                        className="w-full h-36 object-cover rounded-md mb-4 bg-surface" />
                    )}
                    <h3 className="font-semibold text-text-primary mb-1">{project.name}</h3>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.skills.map((s) => (
                        <span key={s}
                          className="text-xs px-2 py-0.5 rounded bg-surface text-text-muted">
                          {s}
                        </span>
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
            </div>
          )}

          {/* 오른쪽: 활동 & 수상 타임라인 */}
          {(profile.activities.length > 0 || profile.awards.length > 0) && (() => {
            const events = [
              ...profile.activities.map((a) => ({ ...a, type: '활동' as const })),
              ...profile.awards.map((a) => ({ ...a, type: '수상' as const })),
            ].sort((a, b) => b.year.localeCompare(a.year))

            return (
              <div className="lg:w-72 shrink-0">
                <h2 className="text-lg font-bold text-text-primary mb-6">활동 & 수상</h2>
                <div className="relative pl-6">
                  <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
                  {events.map((item, i) => (
                    <div key={i} className="relative mb-6 last:mb-0">
                      <div className="absolute -left-6 top-[5px] w-[11px] h-[11px] rounded-full bg-bg border-2 border-border" />
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-0.5">
                        <span className="text-xs text-text-muted tabular-nums">{item.year}</span>
                        <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-px">{item.type}</span>
                      </div>
                      <p className="text-sm text-text-primary">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

        </section>
      </main>
      <Footer />
    </div>
  )
}
