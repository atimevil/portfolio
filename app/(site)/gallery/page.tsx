export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { hiddenFromPublic } from '@/lib/publicGate'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'
import { getSettings } from '@/lib/settings'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  const { profile, navVisibility } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  return buildPageMetadata({ path: '/gallery', title: '갤러리', description: `${name}의 갤러리`, noindex: !navVisibility.gallery })
}

export default async function GalleryPage() {
  // 설정에서 비공개로 둔 메뉴는 방문자에게 없는 페이지로 보인다(로그인한 관리자는 그대로 본다)
  if (await hiddenFromPublic('gallery')) notFound()
  const images = getGalleryImages()
  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">갤러리</h1>
        <p className="mt-1 text-sm text-text-secondary">사진 {images.length}장</p>
      </header>
      <GalleryGrid images={images} />
    </main>
  )
}
