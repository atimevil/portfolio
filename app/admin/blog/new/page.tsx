import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'

export default async function NewBlogPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  return (
    <AdminLayout>
      <BlogEditor />
    </AdminLayout>
  )
}
