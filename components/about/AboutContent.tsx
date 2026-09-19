import { getSettings } from '@/lib/settings'
import { getProjects, getTimeline } from '@/lib/items'
import ProfileHeader from '@/components/layout/ProfileHeader'
import AwardsGantt from '@/components/about/AwardsGantt'
import { t, localized, type Locale } from '@/lib/i18n'
import { splitSummary } from '@/lib/summary'

/** 한국어(/about) · 영문(/en/about)이 공유하는 소개 본문. */
export default function AboutContent({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const projects = getProjects()
  const timeline = getTimeline()
  const hasEvents = timeline.length > 0

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <ProfileHeader profile={profile} locale={locale} />

      {projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-5">
            {t(locale, 'projects')}
          </h2>
          <div className="flex flex-col gap-4">
            {projects.map((project) => {
              const href = project.github || project.link
              const title = localized(project, 'title', locale)
              return (
                <div
                  key={project.id}
                  className={`group flex h-full flex-col rounded-xl border border-border bg-bg-secondary p-5 transition-colors ${href ? 'hover:border-accent focus-within:border-accent' : ''}`}
                >
                  {project.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.thumbnail} alt={title} loading="lazy" decoding="async"
                      className="w-full h-32 object-cover rounded-lg mb-3 bg-surface" />
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    {/* 카드 전체를 <a>로 감싸면 안쪽 <details>(설명 펼치기)가 링크 안에 들어가
                        잘못된 중첩이 된다. 제목만 링크로 두고 카드는 hover 스타일만 맡는다. */}
                    <h3 className="text-base font-bold text-text-primary">
                      {href ? (
                        <a
                          href={href}
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
                  <ProjectDescription text={localized(project, 'description', locale)} locale={locale} />
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.skills?.map((s) => (
                      <span key={s} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{s}</span>
                    ))}
                  </div>
                  {href && (
                    <span
                      aria-hidden="true"
                      className="mt-3 inline-flex items-center gap-1 self-start text-xs text-text-secondary transition-colors group-hover:text-accent"
                    >
                      {project.github ? 'GitHub' : locale === 'en' ? 'Website' : '사이트'}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M9 7h8v8" />
                      </svg>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
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
