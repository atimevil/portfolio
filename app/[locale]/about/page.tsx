import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import Image from 'next/image'
import { getSettings } from '@/lib/settings'
import { getProjects } from '@/lib/projects'

interface Props {
  params: { locale: string }
}

export default function AboutPage({ params: { locale } }: Props) {
  const settings = getSettings()
  const projects = getProjects()
  const { profile } = settings

  const avatarSrc = profile.avatar || (profile.github ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}` : '')
  const allActivities = [
    ...profile.activities.map((a) => ({ ...a, type: 'activity' as const })),
    ...profile.awards.map((a) => ({ ...a, type: 'award' as const })),
  ].sort((a, b) => b.year.localeCompare(a.year))

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-12">

        {/* 프로필 */}
        <section className="flex flex-col sm:flex-row gap-6 items-start mb-14">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-surface ring-2 ring-border shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-text-muted">👤</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary mb-1">{profile.name}</h1>
            <p className="text-sm text-text-secondary mb-4 whitespace-pre-line leading-relaxed">{profile.aboutText}</p>
            <div className="flex flex-wrap gap-3">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline">GitHub</a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline">LinkedIn</a>
              )}
            </div>
          </div>
        </section>

        {/* 기술 스택 */}
        {profile.skills.length > 0 && (
          <section className="mb-14">
            <h2 className="text-lg font-semibold text-text-primary mb-4">기술 스택</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="skill">{skill}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* 프로젝트 */}
        {projects.length > 0 && (
          <section className="mb-14">
            <h2 className="text-lg font-semibold text-text-primary mb-4">프로젝트</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div key={project.id}
                  className="bg-bg-secondary border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {project.thumbnail && (
                    <div className="relative h-36 bg-surface">
                      <Image src={project.thumbnail} alt={project.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary mb-1">{project.name}</h3>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="skill">{skill}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-text-secondary hover:text-primary transition-colors">
                          GitHub →
                        </a>
                      )}
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-text-secondary hover:text-primary transition-colors">
                          링크 →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 활동 및 수상 */}
        {allActivities.length > 0 && (
          <section className="mb-14">
            <h2 className="text-lg font-semibold text-text-primary mb-4">활동 및 수상</h2>
            <div className="flex flex-col gap-3">
              {allActivities.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center pt-1">
                    <span className="text-xs font-mono text-text-muted w-10 text-right shrink-0">{item.year}</span>
                  </div>
                  <div className="flex-1 pb-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.type === 'award'
                          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {item.type === 'award' ? '수상' : '활동'}
                      </span>
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-text-secondary mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  )
}
