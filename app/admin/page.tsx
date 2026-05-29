import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllPostsAdmin } from '@/lib/blog'
import { getProjects } from '@/lib/projects'
import { getGalleryImages } from '@/lib/gallery'
import { getAllViews } from '@/lib/views'

export default async function AdminDashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const posts = getAllPostsAdmin()
  const projects = getProjects()
  const images = getGalleryImages()
  const allViews = getAllViews()

  const stats = [
    { label: '블로그 글', value: posts.length, href: '/admin/blog' },
    { label: '프로젝트', value: projects.length, href: '/admin/projects' },
    { label: '이미지', value: images.length, href: '/admin/gallery' },
  ]

  const recentPosts = posts.slice(0, 5)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-lg font-semibold text-text-primary">대시보드</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group px-5 py-4 bg-bg-secondary border border-border rounded-lg hover:border-primary/40 transition-colors"
          >
            <p className="text-2xl font-bold text-text-primary group-hover:text-primary transition-colors">
              {stat.value}
            </p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-primary">최근 글</h2>
          <Link
            href="/admin/blog/new"
            className="text-xs text-primary hover:underline"
          >
            + 새 글 작성
          </Link>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          {recentPosts.length === 0 ? (
            <p className="text-center text-text-muted py-10 text-sm">글이 없습니다.</p>
          ) : (
            recentPosts.map((post, i) => (
              <div
                key={post.slug}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < recentPosts.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">{post.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {post.date}
                    {(allViews[post.slug] ?? 0) > 0 && (
                      <span className="ml-2">· {allViews[post.slug].toLocaleString()} views</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    post.status === 'published'
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-surface text-text-muted'
                  }`}>
                    {post.status === 'published' ? '발행' : '임시'}
                  </span>
                  <Link
                    href={`/admin/blog/edit/${post.slug}`}
                    className="text-xs text-text-secondary hover:text-primary transition-colors"
                  >
                    수정
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
