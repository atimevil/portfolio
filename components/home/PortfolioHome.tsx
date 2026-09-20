import Link from 'next/link'
import ProfileHeader from '@/components/layout/ProfileHeader'
import SelectedWork from '@/components/home/SelectedWork'
import AwardsGantt from '@/components/about/AwardsGantt'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { getTimeline } from '@/lib/items'
import { t, blogBase, type Locale } from '@/lib/i18n'

/** 홈에 띄울 최근 글 개수. 나머지는 /blog에서 본다. */
const TEASER_COUNT = 3
/** 홈에 띄울 수상·활동 개수. */
const AWARD_COUNT = 4

/**
 * 홈(/ · /en) — 포트폴리오.
 *
 * 글 목록·검색·카테고리 필터·페이지네이션은 전부 /blog가 맡는다. 여기서는
 * "무엇을 만들었는가"만 보여주고, 글은 맨 아래 3편으로 존재만 알린다.
 */
export default async function PortfolioHome({ locale = 'ko' }: { locale?: Locale }) {
  const { profile } = getSettings()
  const posts = (await getAllPosts()).slice(0, TEASER_COUNT)
  const awards = getTimeline()
    .filter((i) => i.type !== 'project')
    .slice(0, AWARD_COUNT)
  const base = blogBase(locale)

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <ProfileHeader profile={profile} showAboutLink locale={locale} />

      <SelectedWork locale={locale} />

      {awards.length > 0 && <AwardsGantt items={awards} locale={locale} />}

      {posts.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t(locale, 'recentPosts')}
            </h2>
            <Link
              href={base}
              className="inline-flex min-h-[24px] items-center text-xs text-text-secondary transition-colors hover:text-accent"
            >
              {t(locale, 'moreWriting')}
            </Link>
          </div>
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
                  {post.category && (
                    <span className="shrink-0 text-xs text-accent">{post.category}</span>
                  )}
                  <span className="shrink-0 font-mono text-xs text-text-secondary">{post.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
