import { cleanEmail } from '@/lib/email'

export default function Footer({ email, github }: { email?: string; github?: string }) {
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
          {/* 원래 여기 있던 "@foxibu"는 /admin으로 갔다 — 라벨과 목적지가 다르고
              관리자 경로가 모든 페이지 하단에 노출됐다. */}
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
