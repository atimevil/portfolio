import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'
import { getPostBySlug } from '@/lib/blog'

interface Props {
  params: { slug: string }
}

export default async function EditBlogPage({ params: { slug } }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const post = getPostBySlug(slug)
  if (!post) notFound()
  return (
    <AdminLayout>
      <BlogEditor locale="" initialPost={post} />
    </AdminLayout>
  )
}
