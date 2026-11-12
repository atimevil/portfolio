import { getAdminSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminSettingsForm from '@/components/admin/AdminSettingsForm'
import { getSettings } from '@/lib/settings'

export default async function AdminSettingsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const settings = getSettings()
  return (
    <AdminLayout>
      <AdminSettingsForm initialSettings={settings} />
    </AdminLayout>
  )
}
