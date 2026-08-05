import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  /** 페이지 이동 시 함께 유지할 다른 쿼리 파라미터 (category, tag, perPage 등) */
  extraParams?: Record<string, string | undefined>
}

function buildHref(basePath: string, page: number, extraParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value)
    }
  }
  params.set('page', String(page))
  return `${basePath}?${params.toString()}`
}

export default function Pagination({ currentPage, totalPages, basePath, extraParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={buildHref(basePath, currentPage - 1, extraParams)}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-md hover:border-text-muted transition-colors"
        >
          ← 이전
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(basePath, page, extraParams)}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            page === currentPage
              ? 'bg-accent text-bg border-accent'
              : 'border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={buildHref(basePath, currentPage + 1, extraParams)}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-md hover:border-text-muted transition-colors"
        >
          다음 →
        </Link>
      )}
    </nav>
  )
}
