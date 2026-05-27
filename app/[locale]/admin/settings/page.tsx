import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminSettingsForm from '@/components/admin/AdminSettingsForm'
import { getSettings } from '@/lib/settings'

interface Props {
  params: { locale: string }
}

export default async function AdminSettingsPage({ params: { locale } }: Props) {
  const session = await getServerSession()
  if (!session) redirect(`/${locale}/admin/login`)
  const settings = getSettings()
  return (
    <AdminLayout>
      <AdminSettingsForm initialSettings={settings} />
    </AdminLayout>
  )
}
