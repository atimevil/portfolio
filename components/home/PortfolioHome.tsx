import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { getOrderedProjects, getTimeline, projectSlug, timeKey } from '@/lib/items'
import { hasCaseStudy, parseMetrics } from '@/lib/caseStudy'
import { readFigure } from '@/lib/figure'
import { cleanEmail } from '@/lib/email'
import { t, localized, blogBase, type Locale, type UiKey } from '@/lib/i18n'
import SectionNav from '@/components/home/SectionNav'

/** 홈에 띄울 개수 — 나머지는 /about, /blog에서 본다. */
const BUILT_COUNT = 4
const RECORD_COUNT = 6
const TEASER_COUNT = 3

// 포지션 문구. 설정의 한 줄 소개(bio)는 검색 설명문을 겸해 짧게 두고,
// 첫 화면에서 "무엇을 하는 사람인가"는 여기서 말한다.
const INTRO: Record<Locale, { role: string; statement: string; summary: string }> = {
  // 학생이라 직함 대신 하는 일을 적는다. 보안은 교육과정 한 번이라 내세우지 않는다.
  ko: {
    role: '학생 · LLM 에이전트 · 모델 평가',
    statement: 'LLM 에이전트를 만들고, 어디서 틀리는지 확인합니다.',
    summary:
      'Kali 보안 도구를 55종 넘게 다루는 MCP 에이전트 CTF-Solver를 만들었고, 금융 문장으로만 학습한 모델이 일반 리뷰에서 어떻게 틀리는지 연구해 KCC 2026에 실었습니다.',
  },
  en: {
    role: 'Student · LLM agents · Model evaluation',
    statement: 'I build LLM agents and measure where they fail.',
    summary:
      'I built CTF-Solver, an MCP agent that drives more than 55 Kali security tools, and published a KCC 2026 paper on how a model trained only on financial text fails on general reviews.',
  },
}

/**
 * 홈(/ · /en).
 *
 * 왼쪽은 고정: 누구이고 무엇을 하는지. 오른쪽은 그 근거를 두 갈래로 나눠 보여준다.
 *  - 프로젝트: 돌아가는 시스템 → 구조도
 *  - 연구·경진대회: 모델이 틀리는 지점을 확인한 기록 → 숫자
 * 같은 "작업"이라도 증거의 모양이 달라서, 섞지 않고 나눈 것 자체가 포지션을 말한다.
 */
export default async function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const intro = INTRO[locale]
  const projects = getOrderedProjects(hasCaseStudy)
  const built = projects.filter((p) => !p.measure)
  const timeline = getTimeline().filter((i) => i.type !== 'project')
  // 연구·경진대회는 종류와 무관하다 — 연구 프로젝트와 경진대회가 한곳에 모인다. 최신순.
  const measured = [...projects, ...timeline].filter((i) => i.measure)
  const measuredIds = new Set(measured.map((i) => i.id))
  measured.sort((a, b) => timeKey(b.year) - timeKey(a.year))
  const record = timeline.filter((i) => !measuredIds.has(i.id))
  const posts = await getAllPosts()
  const mail = cleanEmail(profile.email)
  const aboutHref = locale === 'en' ? '/en/about' : '/about'
  const workBase = locale === 'en' ? '/en/work' : '/work'

  const sections: { id: string; label: UiKey }[] = [
    { id: 'projects', label: 'projects' },
    { id: 'research', label: 'research' },
    { id: 'awards', label: 'awards' },
    { id: 'writing', label: 'recentPosts' },
  ]

  return (
    <main id="main" tabIndex={-1} className="flex-1 w-full outline-none">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-16">
        {/* 왼쪽: 스크롤해도 따라온다(넓은 화면만) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs text-text-muted">{profile.name}</p>
          <p className="mt-1 text-sm font-medium text-accent">{intro.role}</p>
          <h1 className="mt-5 text-[2rem] font-bold leading-[1.25] tracking-tight text-text-primary md:text-[2.5rem]">
            {intro.statement}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">{intro.summary}</p>

          <SectionNav
            label={locale === 'en' ? 'On this page' : '이 페이지에서'}
            sections={sections.map((sec) => ({ id: sec.id, label: t(locale, sec.label) }))}
          />

          <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px] text-text-secondary [&_a]:inline-flex [&_a]:min-h-[24px] [&_a]:items-center [&_a]:transition-colors [&_a:hover]:text-accent">
            {mail && (
              <li>
                <a href={`mailto:${mail}`}>{mail}</a>
              </li>
            )}
            {profile.github && (
              <li>
                <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              </li>
            )}
            {profile.linkedin && (
              <li>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </li>
            )}
            <li>
              <Link href={aboutHref}>{t(locale, 'aboutArrow')}</Link>
            </li>
          </ul>
        </aside>

        {/* 오른쪽: 근거 */}
        <div className="min-w-0">
          <Section id="projects" title="projects" lede="projectsLede" count={projects.length} more={`${aboutHref}#projects`} locale={locale}>
            <ul className="flex flex-col gap-3">
              {built.slice(0, BUILT_COUNT).map((p) => (
                <BuiltRow key={p.id} project={p} href={`${workBase}/${projectSlug(p)}`} locale={locale} />
              ))}
            </ul>
          </Section>

          {measured.length > 0 && (
            <Section id="research" title="research" lede="researchLede" locale={locale}>
              <ul className="flex flex-col">
                {measured.map((item) => (
                  <MeasuredRow
                    key={item.id}
                    item={item}
                    href={item.type === 'project' ? `${workBase}/${projectSlug(item)}` : `${aboutHref}#r-${item.id}`}
                    locale={locale}
                  />
                ))}
              </ul>
            </Section>
          )}

          {record.length > 0 && (
            <Section id="awards" title="awards" count={timeline.length} more={`${aboutHref}#awards`} locale={locale}>
              <ul>
                {record.slice(0, RECORD_COUNT).map((item) => (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    {/* 소개의 그 항목으로 바로 간다 — 도착하면 설명이 펼쳐지고 잠깐 강조된다 */}
                    <Link
                      href={`${aboutHref}#r-${item.id}`}
                      className="group grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="font-mono text-xs text-text-muted">{item.year}</span>
                      <span className="text-sm leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
                        {item.type === 'award' && <span aria-hidden="true" className="mr-1.5 text-accent">★</span>}
                        {localized(item, 'title', locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {posts.length > 0 && (
            <Section id="writing" title="recentPosts" count={posts.length} more={blogBase(locale)} locale={locale}>
              <ul>
                {posts.slice(0, TEASER_COUNT).map((post) => (
                  <li key={post.slug} className="border-b border-border last:border-b-0">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="font-mono text-xs text-text-muted">{post.date}</span>
                      <span className="text-[15px] text-text-primary transition-colors group-hover:text-accent-hover">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </main>
  )
}

function Section({
  id,
  title,
  lede,
  count,
  more,
  locale,
  children,
}: {
  id: string
  title: UiKey
  lede?: UiKey
  count?: number
  more?: string
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 pb-14">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          {t(locale, title)}
          {count !== undefined && <span className="ml-2 font-mono text-sm font-normal text-text-muted">{count}</span>}
        </h2>
        {more && (
          <Link
            href={more}
            // 보이는 글자는 셋 다 "전체 보기"라, 스크린리더 링크 목록에서 구별되게 섹션 이름을 붙인다
            aria-label={locale === 'en' ? `View all ${t(locale, title).toLowerCase()}` : `${t(locale, title)} 전체 보기`}
            className="inline-flex min-h-[24px] items-center text-sm text-text-secondary transition-colors hover:text-accent"
          >
            {t(locale, 'viewAllWork')}
          </Link>
        )}
      </div>
      {lede && <p className="-mt-3 mb-5 text-sm text-text-muted">{t(locale, lede)}</p>}
      {children}
    </section>
  )
}

/** 프로젝트 한 줄 — 왼쪽에 구조도, 오른쪽에 무엇·결과. 구조도는 알아보는 얼굴이라 읽히지 않아도 된다. */
function BuiltRow({ project, href, locale }: { project: PortfolioItem; href: string; locale: Locale }) {
  const figure = readFigure(project.thumbnail)
  const metric = parseMetrics(localized(project, 'metrics', locale))[0]
  const summary = localized(project, 'result', locale).trim() || localized(project, 'description', locale)
  return (
    <li>
      <Link
        href={href}
        className="group grid gap-4 rounded-xl border border-transparent p-3 -mx-3 transition-colors hover:border-border hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[11rem_minmax(0,1fr)]"
      >
        <div
          aria-hidden="true"
          className="fig fig-fill aspect-[16/8] overflow-hidden rounded-lg border border-border bg-bg-secondary p-2"
          dangerouslySetInnerHTML={figure ? { __html: figure } : undefined}
        />
        <div className="min-w-0">
          <p className="font-mono text-xs text-text-muted">{project.year}</p>
          <h3 className="mt-0.5 font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
            {localized(project, 'title', locale)}
          </h3>
          {summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{summary}</p>}
          {metric && (
            <p className="mt-2 font-mono text-xs text-text-muted">
              <span className="text-accent">{metric.value}</span>
              {metric.label && ` · ${metric.label}`}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}

/** 연구·경진대회 한 줄 — 숫자가 먼저. 연구 프로젝트는 상세로, 대회는 소개의 해당 항목으로 간다. */
function MeasuredRow({ item, href, locale }: { item: PortfolioItem; href: string; locale: Locale }) {
  const metric = parseMetrics(localized(item, 'metrics', locale))[0]
  const summary = localized(item, 'result', locale).trim() || localized(item, 'description', locale)
  const body = (
    <>
      <div className="whitespace-nowrap font-mono text-2xl font-medium tracking-tight text-accent">{metric?.value ?? '—'}</div>
      <div className="min-w-0">
        <p className="font-mono text-xs text-text-muted">
          {item.year}
          {metric?.label && ` · ${metric.label}`}
        </p>
        <h3 className="mt-0.5 font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
          {localized(item, 'title', locale)}
        </h3>
        {summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{summary}</p>}
      </div>
    </>
  )
  const cls = 'grid gap-x-4 gap-y-1 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline'
  return (
    <li className="last:[&>*]:border-b-0">
      <Link href={href} className={`group ${cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}>
        {body}
      </Link>
    </li>
  )
}
