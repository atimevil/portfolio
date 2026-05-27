import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'

interface Props {
  params: { locale: string }
}

export default function GalleryPage({ params: { locale } }: Props) {
  const images = getGalleryImages()
  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-content mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">갤러리</h1>
        <GalleryGrid images={images} />
      </main>
      <Footer />
    </div>
  )
}
