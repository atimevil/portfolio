'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '@/lib/useYouTubeClip'
import ClipPauseButton from '@/components/work/ClipPauseButton'

/**
 * 짧은 영상 파일(.mp4/.webm)을 소리 없이 되풀이한다 — 유튜브 장면 모드와 달리 플레이어 표시(채널명·
 * 일시정지 아이콘·'동영상 더보기')가 전혀 없다. 16:9 액자 하나로 홈 대표 타일과 상세 영상 칸에 같이 쓴다.
 *
 * 첫 장면이 준비되면 서서히 보인다 — 자동재생이 막혀도 멈춘 첫 장면과 재생 버튼이 남는다.
 * 움직임 줄이기를 켠 사람에게는 처음부터 멈춘 첫 장면만 보인다.
 * title이 없으면 장식으로 보고 읽기 프로그램에서 숨긴다(홈 타일은 링크 이름이 이미 작업 이름이다).
 * 첫 장면도 못 받으면(없는 경로·네트워크 오류) fallback(없으면 아무것도)으로 바꾼다 — 빈 칸과 눌러도 안 되는 재생 버튼을 남기지 않는다.
 * 이미 한 번 보인 뒤의 오류(잠깐 끊긴 네트워크)는 마지막 장면을 남겨 두고 접지 않는다.
 */
export default function LoopVideo({
  src,
  labels,
  title,
  className = 'rounded-2xl border border-border bg-bg-secondary',
  fallback = null,
}: {
  src: string
  fallback?: ReactNode
  labels: { pause: string; play: string }
  title?: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)
  const [paused, setPaused] = useState(true)
  const [failed, setFailed] = useState(false)
  const frame = `relative aspect-video overflow-hidden ${className}`
  if (failed) return fallback
  // 서버 렌더에서는 움직임 줄이기 설정을 모른다. 빈 액자로 자리만 잡아 두어 영상이 뜰 때 아래 글이 밀리지 않게 한다.
  if (reduced === null) return <div className={frame} />

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  return (
    <div className={frame}>
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
        onError={() => {
          if (!shown) setFailed(true)
        }}
        className={`h-full w-full object-cover transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* z-20: 홈 타일에서는 타일 전체를 덮는 링크(z-10) 위로 올라와야 눌린다 */}
      <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute bottom-3 right-3 z-20" />
    </div>
  )
}
