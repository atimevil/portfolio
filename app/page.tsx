import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import BlogListItem from '@/components/blog/BlogListItem'
import Pagination from '@/components/blog/Pagination'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'

const POSTS_PER_PAGE = 10

interface Props {
  searchParams: { page?: string }
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
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* 모바일: Sidebar 대신 이름 + 소개 한 줄 */}
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
      <Footer />
    </div>
  )
}
