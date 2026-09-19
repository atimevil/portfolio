import Link from 'next/link'
import { cleanEmail } from '@/lib/email'

export default function Footer({ email, github, name }: { email?: string; github?: string; name?: string }) {
  const mail = cleanEmail(email)
  const handle = name?.trim() || 'admin'

  return (
    <footer className="border-t border-border mt-12 py-4">
      {/* 좁은 화면에선 항목이 4개까지 늘어 한 줄에 안 들어가므로 줄바꿈을 허용한다 */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-muted [&_a]:inline-flex [&_a]:min-h-[24px] [&_a]:items-center">
        <span>© {new Date().getFullYear()} Built with Next.js</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {mail && (
            <a href={`mailto:${mail}`} className="hover:text-accent transition-colors">
              {mail}
            </a>
          )}
          <a href="/rss.xml" className="hover:text-accent transition-colors">
            RSS
          </a>
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              GitHub
            </a>
          )}
          {/* 관리자 로그인 진입점. 앱 안에 다른 경로가 없으므로 눈에 띄지 않게 여기 둔다.
              (/admin 자체는 미들웨어가 막고 비로그인은 /admin/login으로 보낸다) */}
          <Link href="/admin" className="hover:text-accent transition-colors">
            @{handle}
          </Link>
        </div>
      </div>
    </footer>
  )
}
