import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-md hover:border-text-muted transition-colors"
        >
          ← 이전
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            page === currentPage
              ? 'bg-text-primary text-bg border-text-primary'
              : 'border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-md hover:border-text-muted transition-colors"
        >
          다음 →
        </Link>
      )}
    </nav>
  )
}
