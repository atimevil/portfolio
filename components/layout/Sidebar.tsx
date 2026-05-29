import type { SiteSettings } from '@/types'

interface SidebarProps {
  settings: SiteSettings
}

export default function Sidebar({ settings }: SidebarProps) {
  const { profile } = settings
  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-surface overflow-hidden border border-border">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-text-muted">
                👤
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-text-primary">{profile.name}</p>
            <p className="text-sm text-text-secondary mt-0.5">{profile.bio}</p>
          </div>
          <div className="flex gap-4 text-xs text-text-muted">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
