'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
// 서버에는 창이 없다 — 첫 페인트는 빈 16:9 칸, 하이드레이션 뒤 실제 값으로 다시 그린다.
const subscribeNothing = () => () => {}

/** 이 시간 안에 '재생 중'을 못 들으면 자동재생을 포기하고 평범한 플레이어로 바꾼다. */
const GIVE_UP_MS = 8000

/**
 * 긴 유튜브 영상에서 한 장면만 소리 없이 자동으로 되풀이한다(움짤처럼).
 *
 * 유튜브의 loop=1은 구간(start/end)을 무시하고 영상 처음으로 돌아가서 쓸 수 없다.
 * 대신 enablejsapi=1로 연 플레이어와 postMessage로만 이야기한다 — 유튜브 API 스크립트를
 * 불러오지 않으니 nonce CSP를 건드리지 않는다. 끝(end)에 닿아 '종료'가 오면 시작으로 되감는다.
 *
 * 자동재생이 막히거나(절전 모드, 브라우저 정책, 영상 쪽 제한) 플레이어가 답하지 않으면
 * 빈 칸으로 두지 않고 컨트롤이 있는 평범한 플레이어로 바꾼다. 움직임 줄이기를 켠 사람도 평범한 플레이어.
 * 5초 넘게 저절로 움직이는 화면이라 멈춤 버튼을 둔다.
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
  const reduced = useSyncExternalStore<boolean | null>(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => null)
  // enablejsapi는 origin을 같이 주라고 한다. 창이 있어야 알 수 있어서 클라이언트에서만 붙인다.
  const origin = useSyncExternalStore(subscribeNothing, () => window.location.origin, () => '')
  const [paused, setPaused] = useState(true)
  const [gaveUp, setGaveUp] = useState(false)
  const clipMode = reduced === false && !gaveUp

  useEffect(() => {
    if (!clipMode) return
    const el = frame.current
    if (!el) return
    const send = (func: string, args: unknown[] = []) =>
      el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')

    // 플레이어가 준비될 때까지 '듣고 있다'를 몇 번 보낸다. 첫 답이 오면 멈춘다.
    let heard = false
    let played = false
    const hello = () => el.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'clip', channel: 'widget' }), '*')
    const timer = window.setInterval(() => (heard ? window.clearInterval(timer) : hello()), 500)
    const giveUp = window.setTimeout(() => {
      if (!played) setGaveUp(true)
    }, GIVE_UP_MS)
    el.addEventListener('load', hello)

    const onMessage = (e: MessageEvent) => {
      if (e.source !== el.contentWindow) return
      let data: { event?: string; info?: unknown } | null = null
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      if (!data) return
      heard = true
      const state =
        data.event === 'onStateChange'
          ? data.info
          : typeof data.info === 'object' && data.info
            ? (data.info as { playerState?: number }).playerState
            : undefined
      if (data.event === 'onError') setGaveUp(true)
      if (state === 1) {
        played = true
        setPaused(false)
      } else if (state === 2) setPaused(true)
      // 0 = 종료(end 지점 도달) → 시작으로 되감아 다시 재생
      if (state === 0) {
        send('seekTo', [start, true])
        send('playVideo')
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(giveUp)
      el.removeEventListener('load', hello)
      window.removeEventListener('message', onMessage)
    }
  }, [clipMode, start, origin])

  const toggle = () => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    )
    setPaused(!paused) // 플레이어가 상태를 알려 오면 그 값으로 다시 맞춰진다
  }

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
      {clipMode && origin && (
        <>
          {/* 눌러도 유튜브로 넘어가지 않게 플레이어는 클릭을 받지 않는다. 조작은 아래 버튼과 '유튜브에서 보기'로. */}
          <iframe
            ref={frame}
            src={`${clipEmbed}&origin=${encodeURIComponent(origin)}`}
            title={title}
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            className="pointer-events-none h-full w-full"
          />
          <button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            className="absolute bottom-3 right-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-bg-translucent px-3 text-xs font-medium text-text-primary backdrop-blur transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {paused ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            )}
            {paused ? labels.play : labels.pause}
          </button>
        </>
      )}
    </div>
  )
}
