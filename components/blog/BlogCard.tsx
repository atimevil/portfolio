'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import type { BlogPost } from '@/types'

interface BlogCardProps {
  post: BlogPost
  locale: string
  viewCount?: number
}

export default function BlogCard({ post, locale, viewCount }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-bg-secondary border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <Link href={`/${locale}/blog/${post.slug}`}>
        <h2 className="text-lg font-semibold text-text-primary hover:text-primary transition-colors mb-2">
          {post.title}
        </h2>
      </Link>
      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
        <span>{post.date}</span>
        <span>·</span>
        <span>읽기 {post.readingTime}분</span>
        {viewCount !== undefined && viewCount > 0 && (
          <>
            <span>·</span>
            <span>{viewCount.toLocaleString()} 조회</span>
          </>
        )}
      </div>
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">{post.excerpt}</p>
      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="tag">{tag}</Badge>
        ))}
      </div>
    </motion.article>
  )
}
