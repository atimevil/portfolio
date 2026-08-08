import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminMusicManager from '@/components/admin/AdminMusicManager'
import { getAllTracks } from '@/lib/music'

export default async function AdminMusicPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  const tracks = await getAllTracks()

  return (
    <AdminLayout>
      <h1 className="text-lg font-semibold text-text-primary mb-6">음악 관리</h1>
      <AdminMusicManager initialTracks={tracks} />
    </AdminLayout>
  )
}
