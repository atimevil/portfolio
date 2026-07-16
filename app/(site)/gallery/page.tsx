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
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">갤러리</h1>
        <p className="mt-1 text-sm text-text-secondary">사진 {images.length}장</p>
      </header>
      <GalleryGrid images={images} />
    </main>
  )
}
