import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminBlogList from '@/components/admin/AdminBlogList'
import { getAllPostsAdmin } from '@/lib/blog'

export default async function AdminBlogPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const posts = getAllPostsAdmin()

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-text-primary">블로그 관리</h1>
        <Link
          href="/admin/blog/new"
          className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-hover transition-colors"
        >
          + 새 글 작성
        </Link>
      </div>
      <AdminBlogList posts={posts} />
    </AdminLayout>
  )
}
