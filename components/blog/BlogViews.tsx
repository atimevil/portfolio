'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { BlogPost } from '@/types'
import BlogListItem from './BlogListItem'
import { t, type Locale } from '@/lib/i18n'

type View = 'list' | 'grid' | 'image'

const TABS = [
  { key: 'list', labelKey: 'viewList' as const },
  { key: 'grid', labelKey: 'viewGrid' as const },
  { key: 'image', labelKey: 'viewImage' as const },
] satisfies { key: View; labelKey: Parameters<typeof t>[1] }[]

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
          <img src={cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.category && <span className="text-xs font-medium text-accent">{post.category}</span>}
        <h3 className="mt-1 line-clamp-2 font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-hover">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-secondary">{post.excerpt}</p>
        <div className="mt-auto pt-4 text-xs text-text-muted">
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
          <img src={cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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

// 고른 보기 방식을 기억한다 — 예전엔 쪽을 넘기거나 필터를 바꿀 때마다(서버 렌더링) 목록으로 돌아갔다.
// 사생활 모드 등에서 저장소가 막혀도 동작은 그대로(기본 목록).
const VIEW_KEY = 'blog-view'

export default function BlogViews({ posts, locale = 'ko' }: { posts: BlogPost[]; locale?: Locale }) {
  const [view, setViewState] = useState<View>('list')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY)
      if (saved && TABS.some((tab) => tab.key === saved)) setViewState(saved as View)
    } catch {
      // 저장소 접근 불가 — 기본값 유지
    }
  }, [])

  function setView(next: View) {
    setViewState(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // 저장 실패해도 이번 화면에서는 바뀐다
    }
  }

  return (
    <div>
      <div className="-mt-1 mb-4 flex justify-end">
        <div role="group" aria-label={locale === 'en' ? 'View' : '보기 방식'} className="flex shrink-0 gap-1 rounded-lg border border-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={view === tab.key}
              onClick={() => setView(tab.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === tab.key ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t(locale, tab.labelKey)}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <GridCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {view === 'image' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ImageCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
