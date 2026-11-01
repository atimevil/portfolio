import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { getOrderedProjects, projectSlug } from '@/lib/items'
import { hasCaseStudy, parseMetrics } from '@/lib/caseStudy'
import { projectLinks } from '@/lib/projectLinks'
import { applyGithubStats } from '@/lib/githubStats'
import { readFigure } from '@/lib/figure'
import { parseVideo, formatClock } from '@/lib/projectVideo'
import YouTubeClip from '@/components/work/YouTubeClip'
import LoopVideo from '@/components/work/LoopVideo'
import { splitTitle, outcome } from '@/lib/projectCard'
import { t, localized, type Locale } from '@/lib/i18n'

/**
 * 프로젝트 상세(/work/<slug>).
 *
 * 소개 페이지는 목록만 갖고, 케이스 스터디·지표·그림 같은 깊은 내용은 여기 산다.
 * 프로젝트마다 고유 주소가 생기므로 지원서에 특정 건만 링크할 수 있다.
 */
export default function ProjectDetail({ project, locale = 'ko' }: { project: PortfolioItem; locale?: Locale }) {
  const title = localized(project, 'title', locale)
  const { name, line } = splitTitle(project, locale)
  const { highlight, role } = outcome(project, locale)
  const links = projectLinks(project, locale)
  const metrics = parseMetrics(applyGithubStats(localized(project, 'metrics', locale), project.github))
  const figure = readFigure(project.thumbnail, locale)
  const video = parseVideo(project.video)
  const loop = parseVideo(project.loop)
  const loopSrc = loop?.kind === 'file' ? loop.src : null
  const columns = (
    [
      ['csProblem', localized(project, 'problem', locale)],
      ['csContribution', localized(project, 'contribution', locale)],
      ['csResult', localized(project, 'result', locale)],
    ] as const
  ).filter(([, body]) => body?.trim())
  const aboutHref = locale === 'en' ? '/en/about' : '/about'
  const homeHref = locale === 'en' ? '/en' : '/'
  const workBase = locale === 'en' ? '/en/work' : '/work'
  // 하나 읽고 나면 뒤로 가는 것 말고 할 게 없었다. 이웃 프로젝트로 이어준다.
  const ordered = getOrderedProjects()
  const here = ordered.findIndex((i) => i.id === project.id)
  const prev = here > 0 ? ordered[here - 1] : undefined
  const next = here >= 0 && here < ordered.length - 1 ? ordered[here + 1] : undefined

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      {/* 홈에서 왔든 소개에서 왔든 돌아갈 곳을 둘 다 보여준다(← 소개 하나로는 홈에서 온 방문자가 막혔다) */}
      <nav aria-label={t(locale, 'projects')} className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <Link href={homeHref} className="min-h-[24px] inline-flex items-center transition-colors hover:text-accent">
          {t(locale, 'home')}
        </Link>
        <span aria-hidden="true" className="text-text-muted">/</span>
        <Link href={aboutHref} className="min-h-[24px] inline-flex items-center transition-colors hover:text-accent">
          {t(locale, 'projects')}
        </Link>
      </nav>

      <header className="mt-4 mb-7 border-b border-border pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="page-title">{name}</h1>
          {project.year && (
            <span className="shrink-0 font-mono text-sm text-text-secondary">{project.year}</span>
          )}
        </div>
        {line && <p className="mt-2 text-lg text-text-secondary">{line}</p>}
        {(highlight || role) && (
          <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {highlight && <span className="font-semibold text-text-primary">{highlight}</span>}
            {role && <span className="text-sm text-text-secondary">{role}</span>}
          </p>
        )}
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
          className="fig mb-8 overflow-hidden rounded-2xl border border-border bg-bg"
          dangerouslySetInnerHTML={{ __html: figure }}
        />
      ) : project.thumbnail ? (
        <img
          src={project.thumbnail}
          alt={title}
          className="mb-8 w-full rounded-2xl border border-border bg-bg object-contain"
        />
      ) : null}

      {/* 영상은 눌러야 불러온다(유튜브는 loading=lazy, 파일은 preload=metadata) — 상세를 열자마자 무거워지지 않게 */}
      {video?.kind === 'youtube' && video.clip && (
        <figure className="mb-8">
          {loopSrc ? (
            <LoopVideo src={loopSrc} title={`${title} — ${t(locale, 'video')}`} labels={{ pause: t(locale, 'pause'), play: t(locale, 'play') }} />
          ) : (
            <YouTubeClip
              embed={video.embed}
              clipEmbed={video.clipEmbed}
              start={video.start}
              title={`${title} — ${t(locale, 'video')}`}
              labels={{ pause: t(locale, 'pause'), play: t(locale, 'play') }}
            />
          )}
          <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="font-mono">
              {formatClock(video.start)}
              {video.end > 0 && ` – ${formatClock(video.end)}`}
            </span>
            <a
              href={video.watch}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[24px] items-center gap-1 transition-colors hover:text-text-primary"
            >
              {t(locale, 'watchOnYoutube')} ↗
            </a>
          </figcaption>
        </figure>
      )}
      {/* 장면 모드가 아닌 유튜브(예: 본선 대국 3분)는 소리·컨트롤이 있는 평범한 플레이어. 반복 파일은 홈 배경용으로만 쓴다. */}
      {video?.kind === 'youtube' && !video.clip && (
        <div className="mb-8 aspect-video overflow-hidden rounded-2xl border border-border bg-bg-secondary">
          <iframe
            src={video.embed}
            title={`${title} — ${t(locale, 'video')}`}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}
      {loopSrc && video?.kind !== 'youtube' && (
        <div className="mb-8">
          <LoopVideo src={loopSrc} title={`${title} — ${t(locale, 'video')}`} labels={{ pause: t(locale, 'pause'), play: t(locale, 'play') }} />
        </div>
      )}
      {video?.kind === 'file' && !loopSrc && (
        <video
          src={video.src}
          controls
          preload="metadata"
          playsInline
          aria-label={`${title} — ${t(locale, 'video')}`}
          className="mb-8 w-full rounded-2xl border border-border bg-bg-secondary"
        />
      )}

      {/* dl 대신 제목(h2) + 본문 — 제목 목록으로 문제·기여·결과 사이를 건너뛸 수 있다. */}
      {columns.length > 0 && (
        <div
          className="mb-8 grid gap-x-8 gap-y-5 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ ['--cols' as string]: String(columns.length) }}
        >
          {columns.map(([key, body]) => (
            <section key={key}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t(locale, key)}
              </h2>
              <div className="text-[15px] leading-relaxed text-text-secondary">{body}</div>
            </section>
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <ul className="mb-8 flex flex-wrap gap-x-12 gap-y-4 tile px-6 py-5">
          {metrics.map((m) => (
            <li key={m.value + m.label}>
              <div className="font-mono text-2xl text-accent">{m.value}</div>
              {m.label && <div className="mt-1 text-xs text-text-secondary">{m.label}</div>}
            </li>
          ))}
        </ul>
      )}

      {/* 포스터는 세로로 아주 길어서(약 1:3) 윗부분만 4:5로 보이고, 누르면 원본이 새 탭에서 열린다 */}
      {project.poster && (
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{t(locale, 'poster')}</h2>
          <a
            href={project.poster}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-bg-secondary transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <img
              src={project.poster}
              alt={`${title} — ${t(locale, 'poster')}`}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <span className="flex min-h-[40px] items-center justify-between border-t border-border px-4 text-xs text-text-secondary transition-colors group-hover:text-text-primary">
              {t(locale, 'viewFullSize')}
              <span aria-hidden="true">↗</span>
            </span>
          </a>
        </section>
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
              className="group tile p-4 transition-colors hover:border-accent"
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
              className="group tile p-4 text-right transition-colors hover:border-accent"
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
