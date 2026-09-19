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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {category && (
        <Link
          href={`/?category=${encodeURIComponent(category)}`}
          className="inline-flex min-h-[26px] items-center rounded-full bg-text-primary/10 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {category}
        </Link>
      )}
      {tags?.map((t) => (
        <Link
          key={t}
          href={`/?tag=${encodeURIComponent(t)}`}
          className="inline-flex min-h-[26px] items-center rounded-full border border-transparent bg-accent-soft px-2.5 py-1 text-xs text-accent transition-colors hover:border-accent"
        >
          #{t}
        </Link>
      ))}
    </div>
  )
}
