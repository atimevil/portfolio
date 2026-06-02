export const dynamic = 'force-dynamic'

import Sidebar from '@/components/layout/Sidebar'
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
  const settings = getSettings()

  const currentPage = Number(searchParams.page ?? 1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const pagePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <div className="lg:hidden mb-6 pb-6 border-b border-border">
        <p className="text-sm font-semibold text-text-primary">{settings.profile.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">{settings.profile.bio}</p>
      </div>
      <div className="flex gap-12">
        <Sidebar settings={settings} />
        <div className="flex-1 min-w-0">
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
        </div>
      </div>
    </main>
  )
}
