import { getAdminSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminCategoryManager from '@/components/admin/AdminCategoryManager'
import { getCategories, getCategoryPostCounts } from '@/lib/categories'

export default async function AdminCategoriesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const [categories, counts] = await Promise.all([getCategories(), getCategoryPostCounts()])
  return (
    <AdminLayout>
      <AdminCategoryManager initialCategories={categories} postCounts={counts} />
    </AdminLayout>
  )
}
