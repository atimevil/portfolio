import { getAdminSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminGalleryManager from '@/components/admin/AdminGalleryManager'
import { getGalleryImages } from '@/lib/gallery'

export default async function AdminGalleryPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const images = getGalleryImages()
  return (
    <AdminLayout>
      <AdminGalleryManager initialImages={images} />
    </AdminLayout>
  )
}
