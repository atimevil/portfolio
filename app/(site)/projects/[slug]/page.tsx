export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getProjectBySlug } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import ProjectBanner from '@/components/projects/ProjectBanner'

export function generateMetadata({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) return buildPageMetadata({ path: `/projects/${params.slug}`, title: '프로젝트', description: '' })
  return buildPageMetadata({
    path: `/projects/${project.slug}`,
    title: project.title,
    description: project.description ?? '',
  })
}

const SECTION_ICON: Record<string, string> = { 문제: '🎯', '내 역할': '🛠️', 결과: '🏆' }

function Section({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div className="mt-5 rounded-r-lg border-l-2 border-accent bg-bg-secondary py-3 pl-4 pr-4">
      <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-accent">
        <span>{SECTION_ICON[label]}</span>
        {label}
      </h2>
      <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{text}</p>
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) notFound()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      {project.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnail}
          alt={project.title}
          className="mb-5 h-48 w-full rounded-xl bg-surface object-cover md:h-64"
        />
      ) : (
        <ProjectBanner title={project.title} className="mb-5 h-48 w-full rounded-xl md:h-64" />
      )}

      <header>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{project.title}</h1>
          {project.year && <span className="shrink-0 font-mono text-xs text-text-muted">{project.year}</span>}
        </div>

        {project.skills && project.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.skills.map((s) => (
              <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                {s}
              </span>
            ))}
          </div>
        )}

        {project.description && (
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{project.description}</p>
        )}
      </header>

      <Section label="문제" text={project.problem} />
      <Section label="내 역할" text={project.role} />
      <Section label="결과" text={project.outcome} />

      {(project.github || project.link) && (
        <div className="mt-8 flex gap-3 border-t border-border pt-6">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
            >
              GitHub
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
            >
              바로가기
            </a>
          )}
        </div>
      )}
    </main>
  )
}
