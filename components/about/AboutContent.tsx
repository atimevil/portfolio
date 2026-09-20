import type { PortfolioItem } from '@/types'
import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline, timeKey } from '@/lib/items'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'
import { t, localized, type Locale } from '@/lib/i18n'
import { splitSummary } from '@/lib/summary'
import { hasCaseStudy, parseMetrics } from '@/lib/caseStudy'
import { projectLinks } from '@/lib/projectLinks'

/** 한국어(/about) · 영문(/en/about)이 공유하는 소개 본문. */
export default function AboutContent({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const all = getProjects()
  // 케이스 스터디(문제·한 일·결과)가 채워진 것만 대표로 펼친다.
  // 설명 한 줄뿐인 프로젝트에 256px 그림을 붙이면 그림이 본문보다 커진다.
  const projects = all.filter(hasCaseStudy)
  // 대표는 손으로 고른 순서(order)를 따르고, 목록은 최신순으로 둔다.
  // 목록까지 수동 순서를 유지하면 항목이 늘 때마다 order를 다시 매겨야 한다.
  const rest = all
    .filter((p) => !hasCaseStudy(p))
    .sort((a, b) => timeKey(b.year) - timeKey(a.year))
  const timeline = getTimeline()
  const hasEvents = timeline.length > 0

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{t(locale, 'about')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t(locale, 'aboutLead')}</p>
      </header>

      <ProfileHeader profile={profile} locale={locale} headingLevel={2} />

      {all.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">
            {t(locale, 'projects')}
          </h2>
          <div className="flex flex-col gap-4">
            {projects.map((project) => {
              const links = projectLinks(project, locale)
              // 목적지가 하나뿐이면 제목에 걸어 탭 정지점을 늘리지 않는다.
              const soleHref = links.length === 1 ? links[0].href : undefined
              const title = localized(project, 'title', locale)
              return (
                <div
                  key={project.id}
                  className={`group flex h-full flex-col rounded-xl border border-border bg-bg-secondary p-5 transition-colors ${links.length > 0 ? 'hover:border-accent focus-within:border-accent' : ''}`}
                >
                  {project.thumbnail && (
                    // 다이어그램·스크린샷은 잘리면 뜻이 사라진다. object-cover(사진용)가 아니라 contain.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.thumbnail} alt={title} loading="lazy" decoding="async"
                      className="mb-3 w-full max-h-64 rounded-lg border border-border bg-bg object-contain" />
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    {/* 카드 전체를 <a>로 감싸면 안쪽 <details>(설명 펼치기)가 링크 안에 들어가
                        잘못된 중첩이 된다. 제목만 링크로 두고 카드는 hover 스타일만 맡는다. */}
                    <h3 className="text-base font-bold text-text-primary">
                      {soleHref ? (
                        <a
                          href={soleHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                    </h3>
                    {project.year && (
                      <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                    )}
                  </div>
                  <CaseStudy project={project} locale={locale} />
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.skills?.map((s) => (
                      <span key={s} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{s}</span>
                    ))}
                  </div>
                  {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {links.map((l) =>
                        soleHref ? (
                          // 제목이 이미 같은 곳을 가리키므로 시각 단서로만 남긴다
                          <span
                            key={l.href}
                            aria-hidden="true"
                            className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors group-hover:text-accent"
                          >
                            {l.label}
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17 17 7M9 7h8v8" />
                            </svg>
                          </span>
                        ) : (
                          <a
                            key={l.href}
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${title} — ${l.label}`}
                            className="inline-flex min-h-[24px] items-center gap-1 rounded-sm text-xs text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {l.label}
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17 17 7M9 7h8v8" />
                            </svg>
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {rest.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                {t(locale, 'moreProjects')}
              </h3>
              <ul className="flex flex-col">
                {rest.map((project) => {
                  const links = projectLinks(project, locale)
                  const title = localized(project, 'title', locale)
                  return (
                    <li key={project.id} className="border-b border-border py-4 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="text-sm font-bold leading-snug text-text-primary">{title}</h4>
                        {project.year && (
                          <span className="shrink-0 font-mono text-xs text-text-secondary">{project.year}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                        {localized(project, 'description', locale)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="text-xs text-text-secondary">
                          {(project.skills ?? []).join(' · ')}
                        </span>
                        <span className="flex flex-wrap gap-x-4">
                          {links.map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${title} — ${l.label}`}
                              className="inline-flex min-h-[24px] items-center gap-1 rounded-sm text-xs text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              {l.label}
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M7 17 17 7M9 7h8v8" />
                              </svg>
                            </a>
                          ))}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 활동 & 수상 — 간결한 목록 */}
      {hasEvents && (
        <AwardsGantt items={timeline.filter((i) => i.type !== 'project')} locale={locale} />
      )}
    </main>
  )
}

/**
 * 프로젝트 설명 — 긴 것만 요약 + 펼치기로 자른다.
 *
 * 같은 페이지 아래 Awards 목록이 이미 <details>로 접혀 있으므로 같은 방식을 쓴다.
 * JS 없이 동작하고, 접힌 내용도 페이지 내 검색(Ctrl+F)으로 찾을 수 있다.
 */
function ProjectDescription({ text, locale }: { text: string; locale: Locale }) {
  const { summary, rest } = splitSummary(text)
  const className = 'text-sm leading-relaxed text-text-secondary mt-2 mb-4 max-w-[68ch]'

  if (!rest) return <p className={className}>{text}</p>

  return (
    <div className={className}>
      {summary}{' '}
      <details className="group/desc inline">
        <summary className="inline cursor-pointer list-none text-text-secondary underline underline-offset-2 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
          <span className="whitespace-nowrap group-open/desc:hidden">{t(locale, 'readMore')} +</span>
          {/* 펼친 뒤에도 라벨이 남아야 되돌릴 수 있다 */}
          <span className="hidden whitespace-nowrap group-open/desc:inline">{t(locale, 'collapse')} −</span>
        </summary>
        <span className="block mt-1.5">{rest}</span>
      </details>
    </div>
  )
}

/**
 * 케이스 스터디 — 문제 / 내가 한 것 / 결과 3분할 + 지표 줄.
 *
 * 성과 수치가 400자 산문 안에 묻히면 훑어보는 사람은 절대 못 찾는다.
 * 채워진 칸만 그리므로 셋 중 둘만 써도 레이아웃이 깨지지 않는다.
 */
function CaseStudy({ project, locale }: { project: PortfolioItem; locale: Locale }) {
  const columns = (
    [
      ['csProblem', project.problem],
      ['csContribution', project.contribution],
      ['csResult', project.result],
    ] as const
  ).filter(([, body]) => body?.trim())
  const metrics = parseMetrics(project.metrics)

  return (
    <div className="mt-3 mb-4">
      <dl
        className="grid gap-x-6 gap-y-4 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ ['--cols' as string]: String(columns.length) }}
      >
        {columns.map(([key, body]) => (
          <div key={key}>
            <dt className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t(locale, key)}
            </dt>
            <dd className="m-0 text-sm leading-relaxed text-text-secondary">{body}</dd>
          </div>
        ))}
      </dl>

      {metrics.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border border-border bg-bg px-4 py-3">
          {metrics.map((m) => (
            <li key={m.value + m.label}>
              <div className="font-mono text-lg text-accent">{m.value}</div>
              {m.label && <div className="mt-0.5 text-xs text-text-secondary">{m.label}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
