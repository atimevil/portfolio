export const dynamic = 'force-dynamic'

import Link from 'next/link'
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
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Projects</h2>
            <Link href="/projects" className="text-xs text-accent hover:text-accent-hover transition-colors">
              프로젝트 더보기 →
            </Link>
          </div>
          <ul className="flex flex-col gap-2.5">
            {projects.slice(0, 5).map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="group flex items-baseline justify-between gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-3 transition-colors hover:border-accent"
                >
                  <span className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent-hover">
                    {project.title}
                  </span>
                  {project.year && (
                    <span className="shrink-0 font-mono text-[11px] text-text-muted">{project.year}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 활동 & 수상 — 가로 간트 (기간 시각화) */}
      {hasEvents && <AwardsGantt items={timeline.filter((i) => i.type !== 'project')} />}
    </main>
  )
}
