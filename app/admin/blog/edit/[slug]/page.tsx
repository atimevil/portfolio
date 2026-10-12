import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'
import { getPostBySlug, getRawExcerpt } from '@/lib/blog'
import { getCategories } from '@/lib/categories'

interface Props {
  params: { slug: string }
}

export default async function EditBlogPage({ params: { slug } }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  const [categories, excerpt] = await Promise.all([getCategories(), getRawExcerpt(post.slug)])
  return (
    <AdminLayout>
      <BlogEditor initialPost={{ ...post, excerpt }} categories={categories} />
    </AdminLayout>
  )
}
