export const dynamic = 'force-dynamic'

import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'
import { getSettings } from '@/lib/settings'

export default async function GalleryPage() {
  const images = getGalleryImages()
  const settings = getSettings()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex gap-12">
          <Sidebar settings={settings} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary mb-6">갤러리</h1>
            <GalleryGrid images={images} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
