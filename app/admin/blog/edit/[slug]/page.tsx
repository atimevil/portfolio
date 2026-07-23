import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'
import { getPostBySlug } from '@/lib/blog'
import { getCategories } from '@/lib/categories'

interface Props {
  params: { slug: string }
}

export default async function EditBlogPage({ params: { slug } }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  const categories = await getCategories()
  return (
    <AdminLayout>
      <BlogEditor initialPost={post} categories={categories} />
    </AdminLayout>
  )
}
