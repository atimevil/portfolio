'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/types'
import BlogListItem from './BlogListItem'

type View = 'list' | 'grid' | 'image'

const TABS: { key: View; label: string }[] = [
  { key: 'list', label: '목록' },
  { key: 'grid', label: '격자' },
  { key: 'image', label: '이미지' },
]

// 상대경로(./) 커버는 목록 라우트에서 안 잡히므로 절대경로/외부 URL만 사용.
function usableCover(cover?: string) {
  return cover && (cover.startsWith('/') || cover.startsWith('http')) ? cover : undefined
}

function GridCard({ post }: { post: BlogPost }) {
  const cover = usableCover(post.cover)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary transition-all hover:-translate-y-0.5 hover:border-accent"
    >
      {/* 커버 이미지가 있으면 상단 썸네일 + 글, 없으면 텍스트만(카드 높이는 자연스럽게 달라짐) */}
      {cover && (
        <div className="h-40 shrink-0 overflow-hidden">
          <img src={cover} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.category && <span className="text-xs font-medium text-accent">{post.category}</span>}
        <h3 className="mt-1 line-clamp-2 font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-text-secondary">{post.excerpt}</p>
        <div className="mt-4 text-xs text-text-muted">
          {post.date} · {post.readingTime}분
        </div>
      </div>
    </Link>
  )
}

function ImageCard({ post }: { post: BlogPost }) {
  const cover = usableCover(post.cover)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary transition-all hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="relative h-40">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent-soft">
            <span className="text-sm font-medium text-accent">{post.category ?? '글'}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
          {post.title}
        </h3>
        <div className="mt-2 text-xs text-text-muted">
          {post.date} · {post.readingTime}분
        </div>
      </div>
    </Link>
  )
}

export default function BlogViews({ posts }: { posts: BlogPost[] }) {
  const [view, setView] = useState<View>('list')

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === t.key ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <div>
          {posts.map((post) => (
            <BlogListItem key={post.slug} post={post} />
          ))}
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <GridCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {view === 'image' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <ImageCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
