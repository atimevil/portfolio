import type { GalleryImage } from '@/types'

export const galleryFullSrc = (image: GalleryImage) => `/uploads/gallery/${image.filename}`

// 썸네일이 없는 예전 항목은 원본으로 대신한다.
export const galleryThumbSrc = (image: GalleryImage) => `/uploads/gallery/${image.thumbnail ?? image.filename}`
