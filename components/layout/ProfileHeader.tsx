import Link from 'next/link'
import type { SiteSettings } from '@/types'
import { cleanEmail } from '@/lib/email'
import { t, type Locale } from '@/lib/i18n'

interface Props {
  profile: SiteSettings['profile']
  /** 홈에서만 "소개 →" 링크를 노출 */
  showAboutLink?: boolean
  locale?: Locale
}

// 영문 태그라인 — 이력서와 같은 문구를 쓴다.
const TAGLINE_EN = 'AI/ML · LLM Agents · Security'

// 홈과 소개 페이지가 동일하게 쓰는 프로필 헤더 (이름 + 설명 + 스킬 + 링크)
export default function ProfileHeader({ profile, showAboutLink = false, locale = 'ko' }: Props) {
  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')
  const description = locale === 'en' ? TAGLINE_EN : profile.aboutText?.trim() || profile.bio
  const mail = cleanEmail(profile.email)

  return (
    <section className="mb-10 pb-8 border-b border-border flex gap-5 items-center">
      <div className="w-[72px] h-[72px] rounded-full bg-surface border border-border overflow-hidden shrink-0">
        {avatarSrc ? (
          <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-text-muted">👤</div>
        )}
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{profile.name}</h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1.5 whitespace-pre-line leading-relaxed">{description}</p>
        )}
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {profile.skills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded bg-accent-soft text-accent">{s}</span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-muted">
          {profile.github && (
            <a href={profile.github} target="_blank" rel="noopener noreferrer"
              className="hover:text-accent transition-colors">GitHub</a>
          )}
          {mail && (
            <a href={`mailto:${mail}`} className="hover:text-accent transition-colors">
              {mail}
            </a>
          )}
          {profile.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
              className="hover:text-accent transition-colors">LinkedIn</a>
          )}
          {showAboutLink && (
            <Link href={locale === 'en' ? '/en/about' : '/about'} className="hover:text-accent transition-colors">{t(locale, 'aboutArrow')}</Link>
          )}
        </div>
      </div>
    </section>
  )
}
