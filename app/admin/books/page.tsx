import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminBookManager from '@/components/admin/AdminBookManager'
import { getAllBooks } from '@/lib/books'

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const [books, query] = await Promise.all([getAllBooks(), searchParams])

  return (
    <AdminLayout wide>
      <h1 className="text-lg font-semibold text-text-primary mb-6">책 관리</h1>
      <AdminBookManager initialBooks={books} initialQuery={query} />
    </AdminLayout>
  )
}
