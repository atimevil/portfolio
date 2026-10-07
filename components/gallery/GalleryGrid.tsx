'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import type { GalleryImage } from '@/types'
import { galleryFullSrc, galleryThumbSrc } from '@/lib/galleryUrl'

// 이미지 모양과 상관없이 볼 수 있게 두 단계로 보여준다.
// - 기본: 보통 사진은 화면 안에 다 들어오게, 세로로 긴 포스터는 폭에 맞춰(글자가 읽히게) 띄우고 스크롤한다.
// - 확대: 이미지를 누르면 원래 해상도로 키우고 상하좌우로 스크롤한다. 누른 지점이 그대로 손가락/커서 아래 남는다.
// 썸네일을 흐리게 먼저 깔고 원본이 오면 바꿔 끼운다.
const TALL_RATIO = 1.6

type Anchor = { rx: number; ry: number; x: number; y: number }

function ModalImage({ image, onZoomableChange }: { image: GalleryImage; onZoomableChange: (z: boolean) => void }) {
  const [loaded, setLoaded] = useState(false)
  const [ratio, setRatio] = useState(0) // 높이/폭
  const [fullWidth, setFullWidth] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomable, setZoomable] = useState(false)
  const fullRef = useRef<HTMLImageElement>(null)
  const anchor = useRef<Anchor | null>(null)
  const thumb = galleryThumbSrc(image)
  const full = galleryFullSrc(image)
  const alt = image.description

  const tall = ratio > TALL_RATIO
  const fit = zoomed ? 'max-w-none h-auto' : tall ? 'w-full h-auto' : 'w-full max-h-[72vh] object-contain'

  function readRatio(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (w) setRatio(h / w)
  }

  function onFullLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    readRatio(e)
    setFullWidth(img.naturalWidth)
    setLoaded(true)
  }

  // 지금 보이는 크기가 원본보다 충분히 작을 때만 확대를 켠다 (작은 이미지는 눌러도 달라질 게 없다)
  useLayoutEffect(() => {
    const img = fullRef.current
    if (zoomed) return
    if (!loaded || !img) {
      setZoomable(false)
      onZoomableChange(false)
      return
    }
    const shown = tall
      ? img.clientWidth / img.naturalWidth
      : Math.min(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight)
    const z = shown < 0.9
    setZoomable(z)
    onZoomableChange(z)
  }, [loaded, tall, zoomed, onZoomableChange])

  function toggleZoom(e: React.MouseEvent<HTMLImageElement>) {
    if (!zoomable) return
    const r = e.currentTarget.getBoundingClientRect()
    anchor.current = { rx: (e.clientX - r.left) / r.width, ry: (e.clientY - r.top) / r.height, x: e.clientX, y: e.clientY }
    setZoomed((z) => !z)
  }

  // 확대/축소 직후, 누른 지점이 다시 커서 아래 오도록 스크롤을 맞춘다
  useLayoutEffect(() => {
    const a = anchor.current
    const img = fullRef.current
    const scroller = img?.closest<HTMLElement>('[data-modal-scroll]')
    anchor.current = null
    if (!a || !img || !scroller) return
    const r = img.getBoundingClientRect()
    scroller.scrollLeft += r.left + a.rx * r.width - a.x
    scroller.scrollTop += r.top + a.ry * r.height - a.y
  }, [zoomed])

  return (
    <div className="relative w-full overflow-hidden bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt={alt}
        aria-hidden
        onLoad={readRatio}
        className={`${fit} transition-opacity duration-300 ${loaded ? 'opacity-0 absolute inset-0' : 'opacity-100 blur-sm scale-105'}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={fullRef}
        src={full}
        alt={alt}
        onLoad={onFullLoad}
        onClick={toggleZoom}
        style={zoomed ? { width: fullWidth } : undefined}
        className={`${fit} ${zoomable ? (zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in') : ''} ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
    </div>
  )
}

interface GalleryGridProps {
  images: GalleryImage[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selected, setSelected] = useState<GalleryImage | null>(null)
  const [zoomable, setZoomable] = useState(false)
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
                ? 'bg-accent-soft text-accent border-accent'
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
                img.src = galleryFullSrc(image)
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryThumbSrc(image)}
                alt={image.description}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            {/* 캡션을 위에 둔다 — 긴 포스터면 아래까지 내려야 안내와 원본 링크가 보였다. 오른쪽은 닫기 버튼 자리 */}
            <div className="flex items-start justify-between gap-4 py-3 pl-5 pr-14">
              <div className="min-w-0">
                {selected.description && <p className="text-sm text-text-primary">{selected.description}</p>}
                {selected.category && <p className="mt-1 text-xs font-medium text-accent">{selected.category}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                {zoomable && <span className="text-text-muted">이미지를 누르면 확대</span>}
                <a
                  href={galleryFullSrc(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-accent"
                >
                  원본 보기 ↗
                </a>
              </div>
            </div>
            <ModalImage key={selected.id} image={selected} onZoomableChange={setZoomable} />
          </div>
        )}
      </Modal>
    </>
  )
}
