export const dynamic = 'force-dynamic'

import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  return buildPageMetadata({ path: '/gallery', title: '갤러리', description: `${name}의 갤러리` })
}

export default async function GalleryPage() {
  const images = getGalleryImages()
  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <h1 className="text-xl font-bold text-text-primary mb-6">갤러리</h1>
      <GalleryGrid images={images} />
    </main>
  )
}
