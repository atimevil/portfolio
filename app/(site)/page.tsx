export const dynamic = 'force-dynamic'

import Link from 'next/link'
import BlogListItem from '@/components/blog/BlogListItem'
import Pagination from '@/components/blog/Pagination'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

const POSTS_PER_PAGE = 10

interface Props {
  searchParams: { page?: string }
}

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오 · 블로그'
  return buildPageMetadata({ path: '', title: name, description })
}

export default async function HomePage({ searchParams }: Props) {
  const posts = getAllPosts()
  const { profile } = getSettings()

  const currentPage = Number(searchParams.page ?? 1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const pagePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      {/* 정체성 스트립 */}
      <section className="mb-8 pb-6 border-b border-border flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface border border-border overflow-hidden shrink-0">
          {avatarSrc ? (
            <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-text-muted">👤</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-text-primary">
            <span className="font-bold">{profile.name}</span>
            {profile.bio && <span className="text-text-secondary"> · {profile.bio}</span>}
          </p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-text-muted">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors">GitHub</a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors">LinkedIn</a>
            )}
            <Link href="/about" className="hover:text-text-primary transition-colors">소개 →</Link>
          </div>
        </div>
      </section>

      {/* 최근 글 */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">최근 글</h2>
        {pagePosts.length === 0 ? (
          <p className="text-text-muted py-16 text-center text-sm">글이 없습니다.</p>
        ) : (
          <div>
            {pagePosts.map((post) => (
              <BlogListItem key={post.slug} post={post} />
            ))}
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
      </section>
    </main>
  )
}
