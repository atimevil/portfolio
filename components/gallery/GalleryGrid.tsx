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
  // 원본은 원래 크기보다 키우지 않는다(작은 이미지가 늘어나 흐려지지 않게). 썸네일은 자리만 잡는 흐린 배경이라 꽉 채운다.
  const fit = zoomed
    ? 'block max-w-none h-auto'
    : `block mx-auto w-auto h-auto max-w-full ${tall ? '' : 'max-h-[72vh]'}`
  const placeholderFit = tall ? 'w-full h-auto' : 'w-full max-h-[72vh] object-contain'

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
    // 확대하면 상자가 이미지 폭만큼 넓어져야 바깥 스크롤이 생긴다(overflow-hidden이면 잘려서 스크롤할 게 없다)
    <div className={`relative bg-surface ${zoomed ? 'w-max min-w-full' : 'w-full overflow-hidden'}`}>
      <img
        src={thumb}
        alt={alt}
        aria-hidden
        onLoad={readRatio}
        className={`${placeholderFit} pointer-events-none transition-opacity duration-300 ${loaded ? 'opacity-0 absolute inset-0' : 'opacity-100 blur-sm scale-105'}`}
      />
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

// 스크랩북처럼 보이게 사진마다 기울기와 테이프를 다르게 준다. id로 정해서 새로고침해도 같은 모양이다.
function hash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}
const TILTS = [-2.2, 1.4, -0.8, 2, -1.6, 0.6, 1.8, -1.2]

function scrapStyle(id: string) {
  const h = hash(id)
  return {
    tilt: TILTS[h % TILTS.length],
    // 셋 중 둘에만 붙인다 — 전부 붙이면 무늬가 되고 스크랩한 느낌이 사라진다
    tape: h % 3 !== 0,
    tapeTilt: h % 2 ? 4 : -5,
  }
}

/** createdAt(ISO) → "2026.10" */
function monthLabel(createdAt: string): string {
  const d = new Date(createdAt)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
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
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`min-h-[32px] rounded-full border px-3.5 text-sm transition-colors ${
              activeCategory === cat
                ? 'border-text-primary bg-text-primary text-bg'
                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 사진: 자르지 않고 원래 비율로 단을 나눠 쌓는다 */}
      {filtered.length === 0 ? (
        <p className="text-center text-text-secondary py-16">이미지가 없습니다.</p>
      ) : (
        <div className="columns-2 gap-5 md:columns-3 md:gap-8 lg:columns-4">
          {filtered.map((image, idx) => {
            const { tilt, tape, tapeTilt } = scrapStyle(image.id)
            const month = monthLabel(image.createdAt)
            return (
              // 버튼이라 키보드(Tab·Enter·Space)로도 열 수 있다
              <motion.button
                type="button"
                key={image.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx, 12) * 0.04 }}
                aria-label={image.description ? `${image.description} 크게 보기` : '이미지 크게 보기'}
                style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
                className="group relative mb-6 block w-full break-inside-avoid bg-paper p-2.5 pb-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.08)] [transform:rotate(var(--tilt))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:[transform:rotate(0deg)_translateY(-4px)] md:mb-10 md:p-3 md:pb-3.5"
                onClick={() => setSelected(image)}
                onMouseEnter={() => {
                  const img = new window.Image()
                  img.src = galleryFullSrc(image)
                }}
              >
                {tape && (
                  <span
                    aria-hidden="true"
                    style={{ transform: `translateX(-50%) rotate(${tapeTilt}deg)` }}
                    className="absolute -top-3 left-1/2 h-6 w-20 bg-tape"
                  />
                )}
                <img
                  src={galleryThumbSrc(image)}
                  alt={image.description}
                  loading="lazy"
                  className="block h-auto w-full bg-surface"
                />
                {(image.description || month) && (
                  <span className="flex items-baseline justify-between gap-3 pt-2.5">
                    <span className="line-clamp-2 text-[13px] leading-snug text-text-primary">{image.description}</span>
                    {month && <span className="shrink-0 font-mono text-[11px] text-text-muted">{month}</span>}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* 이미지 모달 */}
      <Modal open={!!selected} onClose={() => setSelected(null)} label={selected?.description || '이미지'}>
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
