import { getAdminSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminItemManager from '@/components/admin/AdminItemManager'
import { getItems } from '@/lib/items'

export default async function AdminItemsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return (
    <AdminLayout wide>
      <AdminItemManager initialItems={getItems()} />
    </AdminLayout>
  )
}
