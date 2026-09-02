import Link from 'next/link'

export default function Footer({ email }: { email?: string }) {
  return (
    <footer className="border-t border-border mt-12 py-4">
      <div className="max-w-3xl mx-auto px-4 md:px-8 flex items-center justify-between text-xs text-text-muted">
        <span>© {new Date().getFullYear()} Built with Next.js</span>
        <div className="flex items-center gap-4">
          {email && (
            <a href={`mailto:${email}`} className="hover:text-accent transition-colors">
              {email}
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
