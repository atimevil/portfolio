import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminBookManager from '@/components/admin/AdminBookManager'
import { getAllBooks } from '@/lib/books'

export default async function AdminBooksPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const books = await getAllBooks()

  return (
    <AdminLayout>
      <h1 className="text-lg font-semibold text-text-primary mb-6">책 관리</h1>
      <AdminBookManager initialBooks={books} />
    </AdminLayout>
  )
}
