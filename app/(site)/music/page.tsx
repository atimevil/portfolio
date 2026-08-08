export const dynamic = 'force-dynamic'

import { getAllTracks } from '@/lib/music'
import MusicList from '@/components/music/MusicList'

export const metadata = {
  title: '음악',
}

export default async function MusicPage() {
  const tracks = await getAllTracks()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">음악</h1>
        <p className="mt-1 text-sm text-text-secondary">즐겨 듣는 트랙 모음</p>
      </header>

      <MusicList tracks={tracks} />
    </main>
  )
}
