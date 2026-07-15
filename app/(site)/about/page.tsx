export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import ProfileHeader from '@/components/layout/ProfileHeader'
import TimelineItem from '@/components/about/TimelineItem'

// "2025.03~09" / "2025.10~11" / "2026.01~02" 같은 문자열에서 기간(개월)을 계산.
// 단발("2025.04")이나 파싱 불가면 isRange=false.
function parsePeriod(raw: string): { months: number; isRange: boolean } {
  const s = raw.replace(/\s/g, '')
  const parts = s.split(/[~–]/)
  const parseYM = (str: string) => {
    const [y, m] = str.split('.')
    return { y: parseInt(y, 10), m: m ? parseInt(m, 10) : NaN }
  }
  if (parts.length < 2 || parts[1] === '') return { months: 1, isRange: false }
  const start = parseYM(parts[0])
  const end = parts[1].includes('.')
    ? parseYM(parts[1])
    : { y: start.y, m: parseInt(parts[1], 10) }
  if ([start.y, start.m, end.y, end.m].some((n) => Number.isNaN(n))) {
    return { months: 1, isRange: false }
  }
  const months = (end.y - start.y) * 12 + (end.m - start.m) + 1
  return { months: Math.max(1, months), isRange: months >= 2 }
}

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
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* 메인: 프로필 + 프로젝트 */}
        <div className="flex-1 min-w-0">
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
                      <p className="text-xs leading-relaxed text-text-secondary mt-2 mb-4 line-clamp-3">{project.description}</p>
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
        </div>

        {/* 오른쪽: 활동 & 수상 */}
        {hasEvents && (
          <aside className="w-full lg:w-60 shrink-0 border-t border-border pt-8 lg:border-t-0 lg:pt-0">
            <div className="lg:sticky lg:top-20">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">Awards &amp; Activity</h2>
              <div className="relative pl-6">
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
                {(() => {
                  const periods = timeline.map((t) => parsePeriod(t.year))
                  const maxMonths = Math.max(1, ...periods.map((p) => p.months))
                  return timeline.map((item, i) => {
                    const p = periods[i]
                    const bar = p.isRange
                      ? { pct: Math.round((p.months / maxMonths) * 100), months: p.months }
                      : undefined
                    return (
                      <TimelineItem
                        key={item.id}
                        year={item.year}
                        type={item.type === 'project' ? '프로젝트' : item.type === 'award' ? '수상' : '활동'}
                        title={item.title}
                        description={item.description}
                        bar={bar}
                      />
                    )
                  })
                })()}
              </div>
            </div>
          </aside>
        )}

      </div>
    </main>
  )
}
