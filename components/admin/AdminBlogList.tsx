'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { BlogPost } from '@/types'

interface AdminBlogListProps {
  posts: BlogPost[]
}

export default function AdminBlogList({ posts: initialPosts }: AdminBlogListProps) {
  const [posts, setPosts] = useState(initialPosts)

  async function handleDelete(slug: string) {
    if (!confirm('이 글을 삭제하시겠습니까?')) return
    const res = await fetch('/api/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl divide-y divide-border">
      {posts.length === 0 && (
        <p className="text-center text-text-secondary py-10 text-sm">글이 없습니다.</p>
      )}
      {posts.map((post) => (
        <div key={post.slug} className="flex items-center justify-between px-5 py-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/blog/${post.slug}`}
              className="block font-medium text-text-primary text-sm truncate hover:underline"
            >
              {post.title}
            </Link>
            <p className="text-xs text-text-muted mt-0.5">{post.date}</p>
          </div>
          <div className="flex items-center gap-4 ml-4 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              post.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-surface text-text-secondary'
            }`}>
              {post.status === 'published' ? '발행' : '임시'}
            </span>
            <Link
              href={`/admin/blog/edit/${post.slug}`}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              수정
            </Link>
            <button
              onClick={() => handleDelete(post.slug)}
              className="text-xs text-text-secondary hover:text-red-500 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
