import Link from 'next/link'
import HomeHero from '@/components/home/HomeHero'
import SelectedWork from '@/components/home/SelectedWork'
import AwardsGantt from '@/components/about/AwardsGantt'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { getTimeline } from '@/lib/items'
import { t, blogBase, type Locale, type UiKey } from '@/lib/i18n'

/** 홈에 띄울 최근 글 개수. 나머지는 /blog에서 본다. */
const TEASER_COUNT = 3
/** 홈에 띄울 수상·활동 개수. */
const AWARD_COUNT = 4

/**
 * 홈(/ · /en) — 포트폴리오.
 *
 * 사진 위 이름 카드 → 한 줄 소개 → 섹션(제목 · 한 줄 설명 · 내용 · 더 보기) 반복.
 * 글 목록·검색·필터는 /blog, 프로젝트·이력 전체는 /about이 맡는다.
 */
export default async function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const posts = (await getAllPosts()).slice(0, TEASER_COUNT)
  const awards = getTimeline()
    .filter((i) => i.type !== 'project')
    .slice(0, AWARD_COUNT)
  const aboutHref = locale === 'en' ? '/en/about' : '/about'

  return (
    <main id="main" tabIndex={-1} className="flex-1 w-full outline-none">
      <HomeHero profile={profile} locale={locale} />

      <div className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
        <Section title="projects" lede="projectsLede" more={aboutHref} locale={locale}>
          <SelectedWork locale={locale} />
        </Section>

        {awards.length > 0 && (
          <Section title="awards" lede="awardsLede" more={aboutHref} locale={locale}>
            <AwardsGantt items={awards} locale={locale} showHeading={false} />
          </Section>
        )}

        {posts.length > 0 && (
          <Section title="recentPosts" lede="postsLede" more={blogBase(locale)} locale={locale}>
            <ul className="flex flex-col">
              {posts.map((post) => (
                <li key={post.slug} className="border-b border-border py-3 last:border-b-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="flex-1 text-sm font-semibold text-text-primary transition-colors hover:text-accent-hover">
                      {post.title}
                    </span>
                    {post.category && <span className="shrink-0 text-xs text-accent">{post.category}</span>}
                    <span className="shrink-0 font-mono text-xs text-text-secondary">{post.date}</span>
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
  lede,
  more,
  locale,
  children,
}: {
  title: UiKey
  lede: UiKey
  more: string
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <section className="mt-10 border-t border-border pt-10">
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">{t(locale, title)}</h2>
      <p className="mt-2 mb-6 text-sm text-text-secondary">{t(locale, lede)}</p>
      {children}
      <div className="mt-6 flex justify-center">
        <Link
          href={more}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-border px-5 text-sm text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t(locale, 'seeMore')}
        </Link>
      </div>
    </section>
  )
}
