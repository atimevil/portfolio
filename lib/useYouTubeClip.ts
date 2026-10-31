'use client'

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/** 이 시간 안에 '재생 중'을 못 들으면 자동재생을 포기한다. */
const GIVE_UP_MS = 8000

/** 움직임 줄이기 설정. 서버·첫 페인트에서는 null(모름). */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => null)
}

/**
 * 유튜브 임베드(enablejsapi=1)와 postMessage로만 이야기해 한 구간을 되풀이한다.
 *
 * 유튜브의 loop=1은 구간(start/end)을 무시하고 영상 처음으로 돌아가서 쓸 수 없다. 유튜브 API
 * 스크립트를 불러오지 않으니 nonce CSP를 건드리지 않는다. 끝(end)에 닿아 '종료'가 오면 시작으로 되감는다.
 * 8초 안에 '재생 중'을 못 듣거나 오류가 오면 gaveUp — 부르는 쪽이 대신 보여 줄 것을 정한다.
 */
export function useYouTubeClip(frame: RefObject<HTMLIFrameElement | null>, enabled: boolean, start: number) {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(true)
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (!enabled) return
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
      if (data.event === 'onError') setGaveUp(true)
      const state =
        data.event === 'onStateChange'
          ? data.info
          : typeof data.info === 'object' && data.info
            ? (data.info as { playerState?: number }).playerState
            : undefined
      if (state === 1) {
        played = true
        setPlaying(true)
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
  }, [frame, enabled, start])

  const toggle = () => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    )
    setPaused(!paused) // 플레이어가 상태를 알려 오면 그 값으로 다시 맞춰진다
  }

  return { playing, paused, gaveUp, toggle }
}
