'use client'

import { useRef } from 'react'
import { useReducedMotion, useYouTubeClip } from '@/lib/useYouTubeClip'
import ClipPauseButton from '@/components/work/ClipPauseButton'

/**
 * 프로젝트 상세의 영상 칸 — 긴 유튜브 영상에서 한 장면만 소리 없이 자동으로 되풀이한다(움짤처럼).
 * 자동재생이 막히거나 플레이어가 답하지 않으면 빈 칸으로 두지 않고 컨트롤이 있는 평범한 플레이어로 바꾼다.
 * 움직임 줄이기를 켠 사람도 평범한 플레이어.
 */
export default function YouTubeClip({
  embed,
  clipEmbed,
  start,
  title,
  labels,
}: {
  embed: string
  clipEmbed: string
  start: number
  title: string
  labels: { pause: string; play: string }
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const reduced = useReducedMotion()
  const clipOn = reduced === false
  const { paused, gaveUp, toggle } = useYouTubeClip(frame, clipOn, start)

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-bg-secondary">
      {(reduced === true || gaveUp) && (
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-full w-full"
        />
      )}
      {clipOn && !gaveUp && (
        <>
          {/* 눌러도 유튜브로 넘어가지 않게 플레이어는 클릭을 받지 않는다. 조작은 아래 버튼과 '유튜브에서 보기'로. */}
          <iframe
            ref={frame}
            src={clipEmbed}
            title={title}
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            className="pointer-events-none h-full w-full"
          />
          <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute bottom-3 right-3" />
        </>
      )}
    </div>
  )
}
