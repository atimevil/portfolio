import Link from 'next/link'
import type { PortfolioItem } from '@/types'
import HomeHero from '@/components/home/HomeHero'
import SelectedWork from '@/components/home/SelectedWork'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { getOrderedProjects, getTimeline } from '@/lib/items'
import { hasCaseStudy } from '@/lib/caseStudy'
import { t, localized, blogBase, type Locale, type UiKey } from '@/lib/i18n'

/** 첫 화면 그림 다음으로 격자에 깔 작업 수. */
const GRID_COUNT = 4
/** 수상·활동 각 칸에 띄울 개수. */
const RECORD_COUNT = 4
/** 홈에 띄울 최근 글 개수. */
const TEASER_COUNT = 3

/**
 * 홈(/ · /en).
 *
 * 첫 화면: 이름 + 대표 작업의 실제 결과 그림 → 작업 격자 → 이력(수상 | 활동) → 최근 글.
 * 섹션 제목 옆 숫자는 전체 개수라, "전체 보기"로 넘어가면 몇 개가 더 있는지 미리 안다.
 */
export default async function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const projects = getOrderedProjects(hasCaseStudy)
  const [featured, ...rest] = projects
  const timeline = getTimeline().filter((i) => i.type !== 'project')
  const awards = timeline.filter((i) => i.type === 'award')
  const activities = timeline.filter((i) => i.type === 'activity')
  const allPosts = await getAllPosts()
  const aboutHref = locale === 'en' ? '/en/about' : '/about'

  return (
    <main id="main" tabIndex={-1} className="flex-1 w-full outline-none">
      <HomeHero profile={profile} featured={featured} locale={locale} />

      <div className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
        {rest.length > 0 && (
          <Section title="projects" count={projects.length} more={aboutHref} locale={locale}>
            <SelectedWork projects={rest.slice(0, GRID_COUNT)} locale={locale} />
          </Section>
        )}

        {timeline.length > 0 && (
          <Section title="record" count={timeline.length} more={aboutHref} locale={locale}>
            <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
              <RecordList label="awardsOnly" items={awards.slice(0, RECORD_COUNT)} locale={locale} star />
              <RecordList label="activityOnly" items={activities.slice(0, RECORD_COUNT)} locale={locale} />
            </div>
          </Section>
        )}

        {allPosts.length > 0 && (
          <Section title="recentPosts" count={allPosts.length} more={blogBase(locale)} locale={locale}>
            <ul className="flex flex-col">
              {allPosts.slice(0, TEASER_COUNT).map((post) => (
                <li key={post.slug} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]"
                  >
                    <span className="font-mono text-xs text-text-muted">{post.date}</span>
                    <span className="text-[15px] font-medium text-text-primary transition-colors group-hover:text-accent-hover">
                      {post.title}
                    </span>
                    {post.category && (
                      <span className="hidden text-xs text-text-muted sm:block">{post.category}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </main>
  )
}

function Section({
  title,
  count,
  more,
  locale,
  children,
}: {
  title: UiKey
  count: number
  more: string
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          {t(locale, title)}
          <span className="ml-2 font-mono text-sm font-normal text-text-muted">{count}</span>
        </h2>
        <Link
          href={more}
          className="inline-flex min-h-[24px] items-center text-sm text-text-secondary transition-colors hover:text-accent"
        >
          {t(locale, 'viewAllWork')}
        </Link>
      </div>
      {children}
    </section>
  )
}

function RecordList({
  label,
  items,
  locale,
  star = false,
}: {
  label: UiKey
  items: PortfolioItem[]
  locale: Locale
  star?: boolean
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">{t(locale, label)}</h3>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-border py-2.5 last:border-b-0"
          >
            <span className="font-mono text-xs text-text-muted">{item.year}</span>
            <span className="text-sm leading-snug text-text-primary">
              {star && <span aria-hidden="true" className="mr-1.5 text-accent">★</span>}
              {localized(item, 'title', locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
