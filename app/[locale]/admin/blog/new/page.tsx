import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'

interface Props {
  params: { locale: string }
}

export default async function NewBlogPage({ params: { locale } }: Props) {
  const session = await getServerSession()
  if (!session) redirect(`/${locale}/admin/login`)
  return (
    <AdminLayout>
      <BlogEditor locale={locale} />
    </AdminLayout>
  )
}
