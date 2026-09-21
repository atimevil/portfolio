import type { SiteSettings } from '@/types'
import { cleanEmail } from '@/lib/email'
import { TAGLINE_EN } from '@/components/layout/ProfileHeader'
import type { Locale } from '@/lib/i18n'

// 영문 첫 화면의 한 줄. 한국어 한 줄 소개("돌려보고 눈으로 확인해야 납득하는 편입니다")를 옮긴 것이다.
const HERO_LINE_EN = 'I understand things by running them and seeing the results.'

/**
 * 홈 맨 위 — 폭 전체를 채우는 사진 위에 이름·연락처 카드를 얹는다.
 *
 * 대표 사진(profile.cover)이 없으면 배경은 옅은 면으로 두고 카드 옆에 아바타를 세운다.
 */
export default function HomeHero({ profile, locale = 'ko' }: { profile: SiteSettings['profile']; locale?: Locale }) {
  const cover = profile.cover?.trim()
  const avatar =
    profile.avatar ||
    (profile.github ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}` : '')
  const mail = cleanEmail(profile.email)
  const strip = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  // bio는 검색 설명문을 겸해서 뒤에 "· ML · …" 분야 키워드가 붙는다. 분야는 카드의
  // 역할 줄에 이미 있으니 여기서는 문장만 쓴다.
  const line = locale === 'en' ? HERO_LINE_EN : profile.bio.split(' · ')[0].trim()

  return (
    <>
      <section className="relative w-full overflow-hidden border-b border-border">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-bg-secondary" />
        )}
        <div className="relative mx-auto flex min-h-[300px] max-w-6xl items-center gap-10 px-4 py-10 md:min-h-[440px] md:px-8">
          {!cover && avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="hidden h-44 w-44 shrink-0 rounded-full border border-border object-cover md:block"
            />
          )}
          <div className="ml-auto w-full max-w-sm rounded-2xl border border-border bg-bg-translucent p-6 shadow-lg backdrop-blur-md">
            <p className="text-sm font-semibold text-text-secondary">{TAGLINE_EN}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary">{profile.name}</h1>
            <ul className="mt-4 flex flex-col gap-1 text-sm text-text-secondary [&_a]:inline-flex [&_a]:min-h-[24px] [&_a]:items-center [&_a]:transition-colors [&_a:hover]:text-accent">
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
            </ul>
          </div>
        </div>
      </section>

      {line && (
        <p className="mx-auto max-w-6xl px-4 pt-10 text-xl font-bold leading-snug tracking-tight break-keep text-text-primary md:px-8 md:text-2xl">
          {line}
          <span aria-hidden="true" className="caret ml-1 font-normal text-accent">|</span>
        </p>
      )}
    </>
  )
}
