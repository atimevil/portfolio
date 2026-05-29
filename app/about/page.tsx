import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
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

        {/* 프로젝트 */}
        {projects.length > 0 && (
          <section className="mb-12 pb-12 border-b border-border">
            <h2 className="text-lg font-bold text-text-primary mb-6">프로젝트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </section>
        )}

        {/* 활동 & 수상 */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {profile.activities.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">활동</h2>
                <ul className="flex flex-col gap-3">
                  {profile.activities.map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-text-muted mr-2">{item.year}</span>
                      <span className="text-text-primary">{item.title}</span>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-0.5 ml-8">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.awards.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">수상</h2>
                <ul className="flex flex-col gap-3">
                  {profile.awards.map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-text-muted mr-2">{item.year}</span>
                      <span className="text-text-primary">{item.title}</span>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-0.5 ml-8">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
