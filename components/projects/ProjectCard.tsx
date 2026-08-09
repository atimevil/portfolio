import Link from 'next/link'
import type { PortfolioItem } from '@/types'

export default function ProjectCard({ project }: { project: PortfolioItem }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block h-full">
      <div className="flex h-full flex-col rounded-xl border border-border bg-bg-secondary p-5 transition-all hover:border-accent hover:-translate-y-0.5">
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={project.title}
            className="mb-3 h-32 w-full rounded-lg bg-surface object-cover"
          />
        ) : (
          <div
            className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-bg-secondary))' }}
          >
            <span className="select-none text-5xl opacity-10">💻</span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-bold text-text-primary transition-colors group-hover:text-accent-hover">
            {project.title}
          </h3>
          {project.year && (
            <span className="shrink-0 font-mono text-[11px] text-text-muted">{project.year}</span>
          )}
        </div>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
          {project.description}
        </p>
        {project.outcome && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-accent">
            🏆 {project.outcome}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {project.skills?.map((s) => (
            <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
