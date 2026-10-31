import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { getSettings } from '@/lib/settings'
import { getOrderedProjects, getTimeline, projectSlug } from '@/lib/items'
import { parseMetrics } from '@/lib/caseStudy'
import { applyGithubStats } from '@/lib/githubStats'
import { cleanEmail } from '@/lib/email'
import { t, localized, type Locale } from '@/lib/i18n'

/** 대표 작업을 하나도 안 골랐을 때만 최신순으로 이만큼 띄운다. */
const FALLBACK_COUNT = 4

// 홈은 타일 몇 장으로 끝낸다: 누구인지(이름·소속·연락처), 대표 작업(밖에서 확인되는 결과 + 내 역할), 숫자 두 개, 개인 공간.
// 문장은 관리자 설정의 '홈 문장'이 있을 때만 이름 아래에 나온다 — 고민할 슬로건을 기본값으로 두지 않는다.
// 글·전체 이력은 소개와 글 페이지에서 본다.
const OFF_HOURS = [
  { href: '/gallery', key: 'gallery' },
  { href: '/music', key: 'music' },
  { href: '/books', key: 'books' },
] as const

const tile = 'rounded-2xl border border-border bg-bg-secondary'
const tileLink = `${tile} transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`

export default function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile, navVisibility } = getSettings()
  const projects = getOrderedProjects()
  // getOrderedProjects가 최신순이라 고른 것 중 가장 최근 작업이 큰 타일에 온다
  const picked = projects.filter((p) => p.featured)
  const [lead, ...rest] = picked.length > 0 ? picked : projects.slice(0, FALLBACK_COUNT)
  const timeline = getTimeline()
  const awardCount = timeline.filter((i) => i.type === 'award').length
  const activityCount = timeline.filter((i) => i.type === 'activity').length

  const mail = cleanEmail(profile.email)
  const en = locale === 'en'
  const affiliation = (en ? profile.affiliation_en : profile.affiliation)?.trim()
  const headline = (en ? profile.headline_en : profile.headline)?.trim()
  const aboutHref = en ? '/en/about' : '/about'
  const workBase = en ? '/en/work' : '/work'
  const offHours = OFF_HOURS.filter((l) => navVisibility?.[l.key] !== false)
  // 나머지 대표 작업은 넓은 화면에서 한 줄 4칸을 채운다: 셋이면 넓게·좁게·좁게, 둘이면 반반, 하나면 한 줄.
  // 좁은 화면(2칸)에서는 넓은 카드가 한 줄을 다 쓰고 좁은 카드 둘이 나란히 선다.
  const restSpan = (i: number) =>
    rest.length === 1 ? 'col-span-2 lg:col-span-4' : rest.length === 2 || i === 0 ? 'col-span-2' : 'col-span-2 sm:col-span-1'

  return (
    <main id="main" tabIndex={-1} className="flex-1 w-full outline-none">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-10 sm:gap-4 md:px-8 lg:grid-cols-4 lg:py-14">
        <section className={`${tile} col-span-2 flex flex-col justify-between gap-8 p-8 lg:row-span-2 lg:p-10`}>
          <div>
            <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-text-primary lg:text-[3.25rem]">{profile.name}</h1>
            {affiliation && <p className="mt-2 text-lg text-text-primary">{affiliation}</p>}
            {headline && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">{headline}</p>}
          </div>
          <ul className="flex flex-wrap gap-2 text-sm">
            {mail && (
              <li>
                <a href={`mailto:${mail}`} className="inline-flex min-h-[40px] items-center rounded-full bg-text-primary px-4 text-bg transition-opacity hover:opacity-85">
                  {mail}
                </a>
              </li>
            )}
            {profile.github && (
              <li>
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4 text-text-primary transition-colors hover:border-accent">
                  GitHub ↗
                </a>
              </li>
            )}
            {profile.linkedin && (
              <li>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4 text-text-primary transition-colors hover:border-accent">
                  LinkedIn ↗
                </a>
              </li>
            )}
          </ul>
        </section>

        {lead && <LeadTile project={lead} href={`${workBase}/${projectSlug(lead)}`} locale={locale} />}

        {rest.slice(0, 3).map((p, i) => (
          <ProjectTile
            key={p.id}
            project={p}
            href={`${workBase}/${projectSlug(p)}`}
            locale={locale}
            wide={i === 0 || rest.length < 3}
            className={restSpan(i)}
          />
        ))}

        <Link href={`${aboutHref}#awards`} className="flex flex-col justify-between gap-6 rounded-2xl bg-accent p-6 text-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
          <span className="font-mono text-xs opacity-85">{t(locale, 'record')}</span>
          <span className="flex gap-6">
            <Stat value={awardCount} label={t(locale, 'awardCount')} />
            <Stat value={activityCount} label={t(locale, 'activityCount')} />
          </span>
          <span className="text-[13px]">{t(locale, 'viewAllWork')}</span>
        </Link>

        <Link href={`${aboutHref}#projects`} className={`${tileLink} flex flex-col justify-between gap-6 p-6`}>
          <span className="font-mono text-xs text-text-muted">{t(locale, 'workCount')}</span>
          <Stat value={projects.length} />
          <span className="text-[13px] text-accent">{t(locale, 'viewAllWork')}</span>
        </Link>

        {offHours.length > 0 && (
          <nav aria-label={t(locale, 'offHours')} className="flex flex-wrap items-center justify-between gap-4 col-span-2 rounded-2xl bg-surface px-7 py-6">
            <span className="text-sm text-text-secondary">{t(locale, 'offHours')}</span>
            <ul className="flex gap-5 font-semibold text-text-primary">
              {offHours.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className="inline-flex min-h-[24px] items-center transition-colors hover:text-accent">
                    {t(locale, l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </main>
  )
}

/**
 * 제목에 부제가 붙어 있으면 이름과 한 줄 설명으로 나눈다.
 * 한국어는 "첫팀 — 첫 참가자 팀 매칭 서비스", 영문은 "First Team: Team matching …" 꼴로 적혀 있다.
 */
function splitTitle(project: PortfolioItem, locale: Locale): { name: string; line: string } {
  const title = localized(project, 'title', locale)
  const m = title.match(/\s—\s|:\s/)
  if (m?.index) return { name: title.slice(0, m.index), line: title.slice(m.index + m[0].length) }
  return { name: title, line: '' }
}

/** 카드 아래 두 줄: 밖에서 확인되는 결과, 내 역할. 결과를 안 적었으면 지표 첫 줄로 대신한다. */
function outcome(project: PortfolioItem, locale: Locale): { highlight: string; role: string } {
  const role = localized(project, 'role', locale).trim()
  const highlight = localized(project, 'highlight', locale).trim()
  if (highlight) return { highlight, role }
  const metric = parseMetrics(applyGithubStats(localized(project, 'metrics', locale), project.github))[0]
  return { highlight: metric ? [metric.value, metric.label].filter(Boolean).join(' · ') : '', role }
}

function LeadTile({ project, href, locale }: { project: PortfolioItem; href: string; locale: Locale }) {
  const { name, line } = splitTitle(project, locale)
  const { highlight, role } = outcome(project, locale)
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-8 rounded-2xl bg-text-primary p-8 text-bg transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg col-span-2 lg:row-span-2 lg:p-10"
    >
      <span className="flex justify-between gap-3 font-mono text-xs opacity-70">
        <span>{t(locale, 'latest')}</span>
        <span>{project.year}</span>
      </span>
      <span>
        <span className="block text-[2rem] font-bold leading-tight tracking-tight">{name}</span>
        {line && <span className="mt-2 block max-w-md opacity-80">{line}</span>}
      </span>
      {(highlight || role) && (
        <span className="flex flex-col gap-4">
          {/* 토큰 색(var)에는 /20 같은 투명도가 안 붙어서 구분선은 글자색에 opacity로 낸다 */}
          <span aria-hidden="true" className="block h-px bg-current opacity-20" />
          <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            {highlight && <span className="font-semibold">{highlight}</span>}
            {role && <span className="text-[13px] opacity-70">{role}</span>}
          </span>
        </span>
      )}
    </Link>
  )
}

function ProjectTile({
  project,
  href,
  locale,
  wide,
  className,
}: {
  project: PortfolioItem
  href: string
  locale: Locale
  wide: boolean
  className: string
}) {
  const { name, line } = splitTitle(project, locale)
  const { highlight, role } = outcome(project, locale)
  return (
    <Link href={href} className={`${tileLink} group flex flex-col gap-2 p-6 ${className}`}>
      <span className="font-mono text-xs text-text-muted">{project.year}</span>
      <span className={`font-semibold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-accent-hover ${wide ? 'text-[1.375rem]' : 'text-lg'}`}>
        {name}
      </span>
      {line && <span className="text-sm leading-relaxed text-text-secondary">{line}</span>}
      {(highlight || role) && (
        <span className={`mt-auto flex gap-x-4 pt-3 ${wide ? 'flex-wrap items-baseline justify-between' : 'flex-col'}`}>
          {highlight && <span className="font-semibold text-text-primary">{highlight}</span>}
          {role && <span className="text-[13px] text-text-secondary">{role}</span>}
        </span>
      )}
    </Link>
  )
}

function Stat({ value, label }: { value: number; label?: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-[2.75rem] font-bold leading-none tracking-tight">{value}</span>
      {label && <span className="mt-1 text-[13px] opacity-85">{label}</span>}
    </span>
  )
}
