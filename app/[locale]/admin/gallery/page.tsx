import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminGalleryManager from '@/components/admin/AdminGalleryManager'
import { getGalleryImages } from '@/lib/gallery'

interface Props {
  params: { locale: string }
}

export default async function AdminGalleryPage({ params: { locale } }: Props) {
  const session = await getServerSession()
  if (!session) redirect(`/${locale}/admin/login`)
  const images = getGalleryImages()
  return (
    <AdminLayout>
      <AdminGalleryManager initialImages={images} />
    </AdminLayout>
  )
}
