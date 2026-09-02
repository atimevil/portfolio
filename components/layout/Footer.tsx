import Link from 'next/link'
import { cleanEmail } from '@/lib/email'

export default function Footer({ email }: { email?: string }) {
  const mail = cleanEmail(email)

  return (
    <footer className="border-t border-border mt-12 py-4">
      {/* 좁은 화면에선 항목이 4개까지 늘어 한 줄에 안 들어가므로 줄바꿈을 허용한다 */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-muted">
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
          <Link href="/admin" className="hover:text-accent transition-colors">
            @foxibu
          </Link>
        </div>
      </div>
    </footer>
  )
}
