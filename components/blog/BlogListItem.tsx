import Link from 'next/link'
import type { BlogPost } from '@/types'
import TagBadges from '@/components/blog/TagBadges'

interface BlogListItemProps {
  post: BlogPost
}

export default function BlogListItem({ post }: BlogListItemProps) {
  return (
    <article className="py-5 border-b border-border last:border-b-0">
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-base font-semibold text-text-primary hover:underline mb-1.5">
          {post.title}
        </h2>
      </Link>
      <p className="text-xs text-text-muted mb-2">
        {post.date} · {post.readingTime}분 읽기
      </p>
      <p className="text-sm text-text-secondary line-clamp-2">{post.excerpt}</p>
      <TagBadges tags={post.tags} category={post.category} className="mt-2.5" />
    </article>
  )
}
