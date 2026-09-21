import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { getOrderedProjects, projectSlug } from '@/lib/items'
import { hasCaseStudy, parseMetrics } from '@/lib/caseStudy'
import { projectLinks } from '@/lib/projectLinks'
import { readFigure } from '@/lib/figure'
import { t, localized, type Locale } from '@/lib/i18n'

/**
 * 프로젝트 상세(/work/<slug>).
 *
 * 소개 페이지는 목록만 갖고, 케이스 스터디·지표·그림 같은 깊은 내용은 여기 산다.
 * 프로젝트마다 고유 주소가 생기므로 지원서에 특정 건만 링크할 수 있다.
 */
export default function ProjectDetail({ project, locale = 'ko' }: { project: PortfolioItem; locale?: Locale }) {
  const title = localized(project, 'title', locale)
  const links = projectLinks(project, locale)
  const metrics = parseMetrics(localized(project, 'metrics', locale))
  const figure = readFigure(project.thumbnail, locale)
  const columns = (
    [
      ['csProblem', localized(project, 'problem', locale)],
      ['csContribution', localized(project, 'contribution', locale)],
      ['csResult', localized(project, 'result', locale)],
    ] as const
  ).filter(([, body]) => body?.trim())
  const aboutHref = locale === 'en' ? '/en/about' : '/about'
  const workBase = locale === 'en' ? '/en/work' : '/work'
  // 하나 읽고 나면 뒤로 가는 것 말고 할 게 없었다. 이웃 프로젝트로 이어준다.
  const ordered = getOrderedProjects(hasCaseStudy)
  const here = ordered.findIndex((i) => i.id === project.id)
  const prev = here > 0 ? ordered[here - 1] : undefined
  const next = here >= 0 && here < ordered.length - 1 ? ordered[here + 1] : undefined

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <Link
        href={aboutHref}
        className="inline-flex min-h-[24px] items-center text-sm text-text-secondary transition-colors hover:text-accent"
      >
        {t(locale, 'backToAbout')}
      </Link>

      <header className="mt-4 mb-7 border-b border-border pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{title}</h1>
          {project.year && (
            <span className="shrink-0 font-mono text-sm text-text-secondary">{project.year}</span>
          )}
        </div>
        {!hasCaseStudy(project) && project.description && (
          <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-text-secondary">
            {localized(project, 'description', locale)}
          </p>
        )}
      </header>

      {/* 다이어그램은 인라인 — 사이트 테마를 따라가고 SVG 안의 aria-label이 읽힌다.
          업로드한 이미지 등 그 외 썸네일은 그대로 <img>로 건다. */}
      {figure ? (
        <div
          className="fig mb-8 overflow-hidden rounded-xl border border-border bg-bg"
          dangerouslySetInnerHTML={{ __html: figure }}
        />
      ) : project.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnail}
          alt={title}
          className="mb-8 w-full rounded-xl border border-border bg-bg object-contain"
        />
      ) : null}

      {columns.length > 0 && (
        <dl
          className="mb-8 grid gap-x-8 gap-y-5 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ ['--cols' as string]: String(columns.length) }}
        >
          {columns.map(([key, body]) => (
            <div key={key}>
              <dt className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t(locale, key)}
              </dt>
              <dd className="m-0 text-[15px] leading-relaxed text-text-secondary">{body}</dd>
            </div>
          ))}
        </dl>
      )}

      {metrics.length > 0 && (
        <ul className="mb-8 flex flex-wrap gap-x-12 gap-y-4 rounded-xl border border-border bg-bg-secondary px-6 py-5">
          {metrics.map((m) => (
            <li key={m.value + m.label}>
              <div className="font-mono text-2xl text-accent">{m.value}</div>
              {m.label && <div className="mt-1 text-xs text-text-secondary">{m.label}</div>}
            </li>
          ))}
        </ul>
      )}

      {(project.skills?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {project.skills?.map((s) => (
            <span key={s} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              {s}
            </span>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${title} — ${l.label}`}
              className="inline-flex min-h-[24px] items-center gap-1.5 rounded-sm text-sm text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {l.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          ))}
        </div>
      )}
      {(prev || next) && (
        <nav className="grid grid-cols-2 gap-4 border-t border-border pt-6" aria-label={t(locale, 'projects')}>
          {prev ? (
            <Link
              href={`${workBase}/${projectSlug(prev)}`}
              className="group rounded-lg border border-border p-3 transition-colors hover:border-accent"
            >
              <span className="block text-xs text-text-muted">{t(locale, 'prevProject')}</span>
              <span className="mt-1 block line-clamp-2 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                {localized(prev, 'title', locale)}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`${workBase}/${projectSlug(next)}`}
              className="group rounded-lg border border-border p-3 text-right transition-colors hover:border-accent"
            >
              <span className="block text-xs text-text-muted">{t(locale, 'nextProject')}</span>
              <span className="mt-1 block line-clamp-2 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                {localized(next, 'title', locale)}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}
    </main>
  )
}
