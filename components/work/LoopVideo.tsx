'use client'

import { useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useYouTubeClip'
import ClipPauseButton from '@/components/work/ClipPauseButton'

/**
 * 짧은 영상 파일(.mp4/.webm)을 소리 없이 되풀이한다 — 유튜브 장면 모드와 달리 플레이어 표시(채널명·
 * 일시정지 아이콘·'동영상 더보기')가 전혀 없다. 홈 큰 타일 배경(cover)과 상세 영상 칸(frame) 두 모양.
 *
 * 재생이 시작된 뒤에 서서히 보인다. 움직임 줄이기를 켠 사람에게는 멈춘 첫 장면만 보이고 재생 버튼을 둔다.
 */
export default function LoopVideo({
  src,
  variant,
  labels,
  title,
}: {
  src: string
  variant: 'cover' | 'frame'
  labels: { pause: string; play: string }
  title?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(true)
  if (reduced === null) return null

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  const video = (
    <video
      ref={ref}
      src={src}
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload={reduced ? 'metadata' : 'auto'}
      aria-label={title}
      aria-hidden={variant === 'cover' ? true : undefined}
      tabIndex={-1}
      onPlaying={() => {
        setPlaying(true)
        setPaused(false)
      }}
      onLoadedData={() => reduced && setPlaying(true)}
      onPause={() => setPaused(true)}
      className={`h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
    />
  )

  if (variant === 'cover') {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {video}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/55" />
        </div>
        {playing && (
          <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6" />
        )}
      </>
    )
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-bg-secondary">
      {video}
      <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute bottom-3 right-3" />
    </div>
  )
}
