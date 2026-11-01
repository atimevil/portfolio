import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import { getSettings } from '@/lib/settings'
import { getOrderedProjects, getTimeline, projectSlug } from '@/lib/items'
import { splitTitle, outcome } from '@/lib/projectCard'
import { cleanEmail } from '@/lib/email'
import { hiddenFromPublic } from '@/lib/publicGate'
import { t, type Locale } from '@/lib/i18n'
import { parseVideo } from '@/lib/projectVideo'
import LeadClip from '@/components/home/LeadClip'
import LoopVideo from '@/components/work/LoopVideo'

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

const tile = 'tile'
const tileLink = `${tile} transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`

export default async function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
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
  // 비공개로 둔 메뉴는 방문자에게 빼고, 로그인한 관리자에게는 보여 준다(헤더 메뉴와 같은 기준)
  const hidden = await Promise.all(OFF_HOURS.map((l) => hiddenFromPublic(l.key)))
  const offHours = OFF_HOURS.filter((_, i) => !hidden[i])
  // 대표 작업 줄은 넓은 화면에서 4칸: 둘이면 넓게·좁게 + 더보기, 하나면 반 + 더보기, 없으면 더보기만 한 줄.
  // 좁은 화면(2칸)에서는 넓은 카드가 한 줄을 다 쓰고, 더보기와 기록이 나란히 선다.
  const row = rest.slice(0, 2)
  const rowSpan = (i: number) => (row.length === 1 || i === 0 ? 'col-span-2' : 'col-span-2 sm:col-span-1')
  const moreSpan = row.length === 2 ? 'col-span-1' : row.length === 1 ? 'col-span-2' : 'col-span-2 lg:col-span-4'
  // 더보기가 한 칸이면 아주 좁은 화면에서 기록 타일이 그 옆에 붙는다
  const statsSpan =
    (row.length === 2 ? 'col-span-1 sm:col-span-2' : 'col-span-2') + (offHours.length > 0 ? ' lg:col-span-1' : ' lg:col-span-4')
  const moreCount = Math.max(projects.length - (lead ? 1 : 0) - row.length, 0)

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

        {row.map((p, i) => (
          <ProjectTile
            key={p.id}
            project={p}
            href={`${workBase}/${projectSlug(p)}`}
            locale={locale}
            wide={i === 0 || row.length < 2}
            className={rowSpan(i)}
          />
        ))}

        {/* 대표로 고르지 않은 작업은 숫자 하나로 묶어 소개의 전체 목록으로 보낸다 */}
        <Link href={`${aboutHref}#projects`} className={`${tileLink} group flex flex-col justify-between gap-6 p-6 ${moreSpan}`}>
          <span className="font-mono text-xs text-text-muted">{t(locale, 'more')}</span>
          {moreCount > 0 && (
            <span className="flex flex-col">
              <span className="text-[2.75rem] font-bold leading-none tracking-tight text-text-primary">+{moreCount}</span>
              <span className="mt-1 text-[13px] text-text-secondary">{t(locale, 'projects')}</span>
            </span>
          )}
          <span className="text-[13px] text-accent transition-colors group-hover:text-accent-hover">{t(locale, 'viewAllWork')}</span>
        </Link>

        <Link
          href={`${aboutHref}#awards`}
          className={`${tileLink} group flex flex-col justify-between gap-6 p-6 ${statsSpan}`}
        >
          <span className="font-mono text-xs text-text-muted">{t(locale, 'record')}</span>
          <span className="flex gap-6">
            <Stat value={awardCount} label={t(locale, 'awardCount')} />
            <Stat value={activityCount} label={t(locale, 'activityCount')} />
          </span>
          <span className="text-[13px] text-accent transition-colors group-hover:text-accent-hover">{t(locale, 'viewAllWork')}</span>
        </Link>

        {offHours.length > 0 && (
          <nav aria-label={t(locale, 'offHours')} className="flex flex-wrap items-center justify-between gap-4 col-span-2 lg:col-span-3 tile px-7 py-6">
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

// 라이트에서는 먹색으로 뒤집은 큰 타일. 다크에서 그대로 뒤집으면 밝은 회색 판이 튀어서, 바탕보다 한 단계 밝은 면으로 둔다.
function LeadTile({ project, href, locale }: { project: PortfolioItem; href: string; locale: Locale }) {
  const { name, line } = splitTitle(project, locale)
  const { highlight, role } = outcome(project, locale, true)
  // 반복 영상 파일이 있으면 제목 아래 16:9 액자로 넣고(글자와 겹치지 않는다),
  // 없으면 상세에 '장면 모드'(autoplay=1)로 건 유튜브 장면을 타일 배경으로 되풀이한다
  const loop = parseVideo(project.loop)
  const loopSrc = loop?.kind === 'file' ? loop.src : null
  const video = parseVideo(project.video)
  const clip = !loopSrc && video?.kind === 'youtube' && video.clip ? video : null
  const labels = { pause: t(locale, 'pause'), play: t(locale, 'play') }
  return (
    <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-text-primary bg-text-primary text-bg transition-opacity hover:opacity-95 dark:border-border dark:bg-surface dark:text-text-primary lg:row-span-2">
      {clip && <LeadClip clipEmbed={clip.clipEmbed} start={clip.start} labels={labels} />}
      <div className={`relative flex h-full flex-col justify-between p-8 lg:p-10 ${loopSrc ? 'gap-6' : 'gap-8'}`}>
        {/* 배경 장면이 있으면 오른쪽 위에 멈춤 버튼이 앉으므로 날짜를 '최근' 옆으로 붙인다 */}
        <span className={`flex gap-3 font-mono text-xs opacity-70 ${clip ? '' : 'justify-between'}`}>
          <span>{t(locale, 'latest')}</span>
          <span>{project.year}</span>
        </span>
        <span>
          {/* 링크는 이름에 걸고 ::after로 타일 전체를 덮는다 — 액자의 멈춤 버튼(z-20)을 링크 밖에 둘 수 있게 */}
          <Link
            href={href}
            className="block text-[2rem] font-bold leading-tight tracking-tight after:absolute after:inset-0 after:z-10 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
          >
            {name}
          </Link>
          {line && <span className="mt-2 block max-w-md opacity-80">{line}</span>}
        </span>
        {loopSrc && <LoopVideo src={loopSrc} labels={labels} className="rounded-xl bg-black/30" />}
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
      </div>
    </div>
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
  const { highlight, role } = outcome(project, locale, true)
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
      <span className="text-[2.75rem] font-bold leading-none tracking-tight text-text-primary">{value}</span>
      {label && <span className="mt-1 text-[13px] text-text-secondary">{label}</span>}
    </span>
  )
}
