import Link from 'next/link'
import type { SiteSettings, BlogPost } from '@/types'

interface SidebarProps {
  settings: SiteSettings
  recentPosts: BlogPost[]
  locale: string
}

export default function Sidebar({ settings, recentPosts, locale }: SidebarProps) {
  const { profile } = settings
  const avatarSrc = profile.avatar || (profile.github ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}` : '')

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="sticky top-20 flex flex-col gap-5">
        {/* 프로필 */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface overflow-hidden ring-2 ring-border">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-text-muted">👤</div>
            )}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">{profile.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">{profile.bio}</p>
          </div>
          <div className="flex gap-3 justify-center">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-primary transition-colors">
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-primary transition-colors">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* 최근 글 */}
        {recentPosts.length > 0 && (
          <div className="bg-bg-secondary border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">최근 글</h3>
            <ul className="flex flex-col gap-2.5">
              {recentPosts.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${locale}/blog/${p.slug}`}
                    className="text-sm text-text-secondary hover:text-primary transition-colors line-clamp-1"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-text-muted mt-0.5">{p.date}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}
