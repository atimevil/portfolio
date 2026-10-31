'use client'

import { useRef } from 'react'
import { useOrigin, useReducedMotion, useYouTubeClip } from '@/lib/useYouTubeClip'
import ClipPauseButton from '@/components/work/ClipPauseButton'

/**
 * 홈 큰 대표 타일의 배경 영상 — 상세에 건 장면(autoplay=1)을 소리 없이 되풀이한다.
 *
 * 실제로 재생이 시작된 뒤에만 보이게 해서 유튜브 로딩 화면·제목 띠가 비치지 않는다.
 * 재생 신호가 오기 전까지는 투명해서, 자동재생이 막혀도 타일은 원래 단색으로 보인다. 움직임 줄이기면 아예 띄우지 않는다.
 * 타일 글자는 두 테마 모두 밝은색이라, 영상 위에는 어두운 막만 깔면 읽힌다.
 */
export default function LeadClip({
  clipEmbed,
  start,
  labels,
}: {
  clipEmbed: string
  start: number
  labels: { pause: string; play: string }
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const reduced = useReducedMotion()
  const origin = useOrigin()
  const on = reduced === false && origin !== ''
  // 숨긴 채 기다리므로 시간 제한 없이 재생 신호를 기다린다. 오류가 오면 그때 접는다.
  const { playing, paused, gaveUp, toggle } = useYouTubeClip(frame, on, start)
  if (!on || gaveUp) return null

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 [container-type:size] ${playing ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* 16:9 영상을 타일 크기에 맞춰 꽉 채운다(넘치는 쪽은 잘림). 살짝 키워 가장자리 유튜브 표시를 밀어낸다. */}
        <iframe
          ref={frame}
          src={`${clipEmbed}&origin=${encodeURIComponent(origin)}`}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 scale-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/55" />
      </div>
      {playing && (
        <ClipPauseButton paused={paused} onToggle={toggle} labels={labels} className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6" />
      )}
    </>
  )
}
