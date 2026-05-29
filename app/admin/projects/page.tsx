import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminProjectManager from '@/components/admin/AdminProjectManager'
import { getProjects } from '@/lib/projects'

export default async function AdminProjectsPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const projects = getProjects()
  return (
    <AdminLayout>
      <AdminProjectManager initialProjects={projects} />
    </AdminLayout>
  )
}
