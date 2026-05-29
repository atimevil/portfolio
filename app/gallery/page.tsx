import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'

export default async function GalleryPage() {
  const images = getGalleryImages()
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-6">갤러리</h1>
        <GalleryGrid images={images} />
      </main>
      <Footer />
    </div>
  )
}
