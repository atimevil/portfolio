import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminItemManager from '@/components/admin/AdminItemManager'
import { getItems } from '@/lib/items'

export default async function AdminItemsPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  return (
    <AdminLayout>
      <AdminItemManager initialItems={getItems()} />
    </AdminLayout>
  )
}
