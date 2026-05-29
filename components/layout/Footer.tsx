import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-4">
      <div className="max-w-4xl mx-auto px-4 md:px-8 flex items-center justify-between text-xs text-text-muted">
        <span>© 2024 Built with Next.js</span>
        <Link href="/admin/login" className="hover:text-text-secondary transition-colors">
          @foxibu
        </Link>
      </div>
    </footer>
  )
}
