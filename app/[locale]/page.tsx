import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import BlogCard from '@/components/blog/BlogCard'
import Pagination from '@/components/blog/Pagination'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { getAllViews } from '@/lib/views'

const POSTS_PER_PAGE = 5

interface Props {
  params: { locale: string }
  searchParams: { page?: string }
}

export default async function HomePage({ params: { locale }, searchParams }: Props) {
  const posts = getAllPosts()
  const settings = getSettings()
  const allViews = getAllViews()

  const currentPage = Number(searchParams.page ?? 1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const pagePosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {pagePosts.length === 0 ? (
              <p className="text-text-secondary py-16 text-center">글이 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {pagePosts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    locale={locale}
                    viewCount={allViews[post.slug] ?? 0}
                  />
                ))}
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/${locale}`} />
          </div>

          <Sidebar settings={settings} recentPosts={posts.slice(0, 5)} locale={locale} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
