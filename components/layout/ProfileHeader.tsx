import type { SiteSettings } from '@/types'
import { cleanEmail } from '@/lib/email'
import type { Locale } from '@/lib/i18n'

interface Props {
  profile: SiteSettings['profile']
  /** 페이지에 별도 h1이 있으면 2로 낮춘다 (h1은 한 페이지에 하나). */
  headingLevel?: 1 | 2
  locale?: Locale
}

// 영문 태그라인. 보안은 교육과정(화이트햇 스쿨) 한 번이라 내세우지 않는다 — 이력이 궁금하면
// 아래 수상·활동에 있다. 이력서의 같은 줄도 이 문구에 맞춘다.
const TAGLINE_EN = 'AI/ML · LLM Agents'

// 홈과 소개 페이지가 동일하게 쓰는 프로필 헤더 (이름 + 설명 + 스킬 + 링크)
export default function ProfileHeader({ profile, locale = 'ko', headingLevel = 1 }: Props) {
  const NameHeading = headingLevel === 1 ? 'h1' : 'h2'
  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')
  const description = locale === 'en' ? TAGLINE_EN : profile.aboutText?.trim() || profile.bio
  const mail = cleanEmail(profile.email)

  // 아바타를 왼쪽에 두면 이름·소개만 92px 안으로 밀려, 아래 섹션들과 왼쪽
  // 가장자리가 어긋난다. 오른쪽으로 보내 본문 기준선에 맞춘다.
  return (
    <section className="mb-10 flex flex-row-reverse items-center justify-end gap-5 border-b border-border pb-8">
      <div className="w-[72px] h-[72px] rounded-full bg-surface border border-border overflow-hidden shrink-0">
        {avatarSrc ? (
          <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-text-muted">👤</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <NameHeading className="text-2xl font-extrabold tracking-tight text-text-primary">{profile.name}</NameHeading>
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
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-muted [&>a]:inline-flex [&>a]:min-h-[24px] [&>a]:items-center">
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
        </div>
      </div>
    </section>
  )
}
