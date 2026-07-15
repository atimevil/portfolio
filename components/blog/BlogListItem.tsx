import Link from 'next/link'
import type { BlogPost } from '@/types'
import TagBadges from '@/components/blog/TagBadges'

interface BlogListItemProps {
  post: BlogPost
}

export default function BlogListItem({ post }: BlogListItemProps) {
  return (
    <article className="group py-6 border-b border-border last:border-b-0">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.category && (
          <span className="text-xs font-medium text-accent">{post.category}</span>
        )}
        <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary transition-colors group-hover:text-accent-hover">
          {post.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary line-clamp-2">
          {post.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <span>{post.date}</span>
          <span aria-hidden>·</span>
          <span>{post.readingTime}분</span>
        </div>
      </Link>
      <TagBadges tags={post.tags} className="mt-3" />
    </article>
  )
}
