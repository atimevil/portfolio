'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import type { GalleryImage } from '@/types'

// 블러 플레이스홀더 → 원본 크로스페이드
function ModalImage({ filename, alt }: { filename: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const thumb = `/_next/image?url=${encodeURIComponent(`/uploads/gallery/${filename}`)}&w=400&q=60`
  const full = `/uploads/gallery/${filename}`

  return (
    <div className="relative w-full rounded-t-xl overflow-hidden bg-surface">
      {/* 썸네일: 즉시 표시, 원본 로드되면 숨김 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt={alt}
        aria-hidden
        className={`w-full max-h-[72vh] object-contain transition-opacity duration-300 ${loaded ? 'opacity-0 absolute inset-0' : 'opacity-100 blur-sm scale-105'}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={full}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full max-h-[72vh] object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
    </div>
  )
}

interface GalleryGridProps {
  images: GalleryImage[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selected, setSelected] = useState<GalleryImage | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('전체')

  const categories = ['전체', ...Array.from(new Set(images.map((i) => i.category)))]
  const filtered = activeCategory === '전체' ? images : images.filter((i) => i.category === activeCategory)

  return (
    <>
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeCategory === cat
                ? 'bg-text-primary text-bg border-text-primary'
                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 이미지 그리드 */}
      {filtered.length === 0 ? (
        <p className="text-center text-text-secondary py-16">이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((image, idx) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-surface"
              onClick={() => setSelected(image)}
              onMouseEnter={() => {
                const img = new window.Image()
                img.src = `/uploads/gallery/${image.filename}`
              }}
            >
              <Image
                src={`/uploads/gallery/${image.filename}`}
                alt={image.description}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {image.description && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-xs line-clamp-2">{image.description}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* 이미지 모달 */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <ModalImage filename={selected.filename} alt={selected.description} />
            {(selected.description || selected.category) && (
              <div className="px-5 py-4">
                {selected.description && (
                  <p className="text-sm text-text-primary">{selected.description}</p>
                )}
                {selected.category && (
                  <p className="mt-1 text-xs text-text-muted">{selected.category}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
