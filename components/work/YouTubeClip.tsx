'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/**
 * 긴 유튜브 영상에서 한 장면만 소리 없이 자동으로 되풀이한다(움짤처럼).
 *
 * 유튜브의 loop=1은 구간(start/end)을 무시하고 영상 처음으로 돌아가서 쓸 수 없다.
 * 대신 enablejsapi=1로 연 플레이어와 postMessage로만 이야기한다 — 유튜브 API 스크립트를
 * 불러오지 않으니 nonce CSP를 건드리지 않는다. 끝(end)에 닿아 '종료'가 오면 시작으로 되감는다.
 *
 * 움직임 줄이기를 켠 사람에게는 자동재생 대신 평범한 플레이어를 보여 준다.
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
  // null = 아직 모름(서버 렌더·첫 페인트). 그 사이에는 빈 16:9 칸만 둔다.
  const reduced = useSyncExternalStore<boolean | null>(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => null)
  // 실제 재생 상태를 따라간다. 자동재생이 막힌 기기(절전 모드 등)에서는 '재생' 버튼이 보여 눌러서 볼 수 있다.
  const [paused, setPaused] = useState(true)

  useEffect(() => {
    if (reduced !== false) return
    const el = frame.current
    if (!el) return
    const send = (func: string, args: unknown[] = []) =>
      el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')

    // 플레이어가 준비될 때까지 '듣고 있다'를 몇 번 보낸다. 첫 답이 오면 멈춘다.
    let heard = false
    const hello = () => el.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'clip', channel: 'widget' }), '*')
    const timer = window.setInterval(() => (heard ? window.clearInterval(timer) : hello()), 500)
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
      if (state === 1) setPaused(false)
      else if (state === 2 || state === -1 || state === 5) setPaused(true)
      // 0 = 종료(end 지점 도달) → 시작으로 되감아 다시 재생
      if (state === 0) {
        send('seekTo', [start, true])
        send('playVideo')
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.clearInterval(timer)
      el.removeEventListener('load', hello)
      window.removeEventListener('message', onMessage)
    }
  }, [reduced, start])

  const toggle = () => {
    const el = frame.current
    if (!el) return
    el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }), '*')
    setPaused(!paused) // 플레이어가 상태를 알려 오면 그 값으로 다시 맞춰진다
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-bg-secondary">
      {reduced === true && (
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-full w-full"
        />
      )}
      {reduced === false && (
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
