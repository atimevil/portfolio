import Link from 'next/link'
import type { PortfolioItem, SiteSettings } from '@/types'
import { cleanEmail } from '@/lib/email'
import { readFigure } from '@/lib/figure'
import { projectSlug } from '@/lib/items'
import { TAGLINE_EN } from '@/components/layout/ProfileHeader'
import { t, localized, type Locale } from '@/lib/i18n'

// 영문 첫 화면의 한 줄. 한국어 한 줄 소개("돌려보고 눈으로 확인해야 납득하는 편입니다")를 옮긴 것이다.
const HERO_LINE_EN = 'I understand things by running them and seeing the results.'

/**
 * 홈 맨 위 — 왼쪽에 이름과 한 줄, 오른쪽에 대표 작업의 실제 결과 그림.
 *
 * 한 줄 소개가 "눈으로 확인해야 납득한다"라서, 무엇을 하는지 설명하는 대신
 * 결과물 하나를 첫 화면에 그대로 보여준다. 그림은 인라인이라 aria-label이 읽힌다.
 */
export default function HomeHero({
  profile,
  featured,
  locale = 'ko',
}: {
  profile: SiteSettings['profile']
  featured?: PortfolioItem
  locale?: Locale
}) {
  const mail = cleanEmail(profile.email)
  const strip = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  // bio는 검색 설명문을 겸해서 뒤에 "· ML · …" 분야 키워드가 붙는다. 분야는 위 줄에 있으니 문장만 쓴다.
  const line = locale === 'en' ? HERO_LINE_EN : profile.bio.split(' · ')[0].trim()
  const figure = readFigure(featured?.thumbnail)
  const workBase = locale === 'en' ? '/en/work' : '/work'

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="grid-paper absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:items-center lg:gap-14 lg:py-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">{TAGLINE_EN}</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-text-primary md:text-6xl">{profile.name}</h1>
          {line && <p className="mt-5 max-w-md text-lg leading-relaxed text-text-secondary">{line}</p>}
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px] text-text-secondary [&_a]:inline-flex [&_a]:min-h-[24px] [&_a]:items-center [&_a]:transition-colors [&_a:hover]:text-accent">
            {mail && (
              <li>
                <a href={`mailto:${mail}`}>{mail}</a>
              </li>
            )}
            {profile.github && (
              <li>
                <a href={profile.github} target="_blank" rel="noopener noreferrer">{strip(profile.github)}</a>
              </li>
            )}
            {profile.linkedin && (
              <li>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">{strip(profile.linkedin)}</a>
              </li>
            )}
            <li>
              <Link href={locale === 'en' ? '/en/about' : '/about'}>{t(locale, 'aboutArrow')}</Link>
            </li>
          </ul>
        </div>

        {featured && figure && (
          <figure className="min-w-0">
            <div
              className="fig overflow-hidden rounded-2xl border border-border bg-bg shadow-sm"
              dangerouslySetInnerHTML={{ __html: figure }}
            />
            <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="min-w-0 text-text-secondary">
                <span className="mr-2 text-xs font-medium text-accent">{t(locale, 'featured')}</span>
                {localized(featured, 'title', locale)}
              </span>
              <Link
                href={`${workBase}/${projectSlug(featured)}`}
                className="inline-flex min-h-[24px] shrink-0 items-center text-text-secondary transition-colors hover:text-accent"
              >
                {t(locale, 'detailsArrow')}
              </Link>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  )
}
