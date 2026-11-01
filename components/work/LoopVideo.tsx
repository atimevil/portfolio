'use client'

import { useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useYouTubeClip'
import ClipPauseButton from '@/components/work/ClipPauseButton'

/**
 * 짧은 영상 파일(.mp4/.webm)을 소리 없이 되풀이한다 — 유튜브 장면 모드와 달리 플레이어 표시(채널명·
 * 일시정지 아이콘·'동영상 더보기')가 전혀 없다. 16:9 액자 하나로 홈 대표 타일과 상세 영상 칸에 같이 쓴다.
 *
 * 첫 장면이 준비되면 서서히 보인다 — 자동재생이 막혀도 멈춘 첫 장면과 재생 버튼이 남는다.
 * 움직임 줄이기를 켠 사람에게는 처음부터 멈춘 첫 장면만 보인다.
 * title이 없으면 장식으로 보고 읽기 프로그램에서 숨긴다(홈 타일은 링크 이름이 이미 작업 이름이다).
 */
export default function LoopVideo({
  src,
  labels,
  title,
  className = 'rounded-2xl border border-border bg-bg-secondary',
}: {
  src: string
  labels: { pause: string; play: string }
  title?: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)
  const [paused, setPaused] = useState(true)
  if (reduced === null) return null

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <video
        ref={ref}
        src={src}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload={reduced ? 'metadata' : 'auto'}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        tabIndex={-1}
        onLoadedData={() => setShown(true)}
        onPlaying={() => {
          setShown(true)
          setPaused(false)
        }}
        onPause={() => setPaused(true)}
        className={`h-full w-full object-cover transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* z-20: 홈 타일에서는 타일 전체를 덮는 링크(z-10) 위로 올라와야 눌린다 */}
      <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute bottom-3 right-3 z-20" />
    </div>
  )
}
