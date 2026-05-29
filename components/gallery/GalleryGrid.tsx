'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import type { GalleryImage } from '@/types'

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
          <div className="p-4">
            <div className="relative w-full" style={{ aspectRatio: '4/3', maxHeight: '70vh' }}>
              <Image
                src={`/uploads/gallery/${selected.filename}`}
                alt={selected.description}
                fill
                className="object-contain rounded-lg"
              />
            </div>
            {selected.description && (
              <p className="mt-3 text-sm text-text-secondary text-center">{selected.description}</p>
            )}
            {selected.category && (
              <p className="mt-1 text-xs text-text-muted text-center">{selected.category}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
