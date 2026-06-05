import Link from 'next/link'

interface TagBadgesProps {
  tags?: string[]
  category?: string
  className?: string
}

// 글의 카테고리/태그를 배지로 표시한다. 클릭하면 홈(/)에서 해당 분류로 필터된다.
export default function TagBadges({ tags, category, className = '' }: TagBadgesProps) {
  if (!category && !(tags && tags.length)) return null
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {category && (
        <Link
          href={`/?category=${encodeURIComponent(category)}`}
          className="rounded-full bg-text-primary/10 px-2 py-0.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {category}
        </Link>
      )}
      {tags?.map((t) => (
        <Link
          key={t}
          href={`/?tag=${encodeURIComponent(t)}`}
          className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors"
        >
          #{t}
        </Link>
      ))}
    </div>
  )
}
