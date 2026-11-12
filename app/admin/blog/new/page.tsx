import { getAdminSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'
import { getCategories } from '@/lib/categories'

export default async function NewBlogPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const categories = await getCategories()
  return (
    <AdminLayout>
      <BlogEditor categories={categories} />
    </AdminLayout>
  )
}
