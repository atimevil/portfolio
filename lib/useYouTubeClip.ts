'use client'

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

const YT_ORIGIN = /^https:\/\/www\.youtube(?:-nocookie)?\.com$/

/** 주소에 ?clipdebug를 붙이면 플레이어와 주고받는 내용을 콘솔에 남긴다(배포본에서 원인 찾기용). */
function debugOn(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('clipdebug')
  } catch {
    return false
  }
}

const subscribeNothing = () => () => {}
/** enablejsapi 임베드에 같이 줄 origin. 창이 있어야 알 수 있어 서버에서는 ''. */
export function useOrigin(): string {
  return useSyncExternalStore(subscribeNothing, () => window.location.origin, () => '')
}

/** 움직임 줄이기 설정. 서버·첫 페인트에서는 null(모름). */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => null)
}

/**
 * 유튜브 임베드(enablejsapi=1)와 postMessage로만 이야기해 한 구간을 되풀이한다.
 *
 * 유튜브의 loop=1은 구간(start/end)을 무시하고 영상 처음으로 돌아가서 쓸 수 없다. 유튜브 API
 * 스크립트를 불러오지 않으니 nonce CSP를 건드리지 않는다. 끝(end)에 닿아 '종료'가 오면 시작으로 되감는다.
 * giveUpMs 안에 '재생 중'을 못 듣거나 오류가 오면 gaveUp — 부르는 쪽이 대신 보여 줄 것을 정한다.
 * 긴 중계 영상은 구간까지 찾아가 버퍼링하는 데 오래 걸릴 수 있어서, 버퍼링(3) 신호가 오면 기다린다.
 */
export function useYouTubeClip(
  frame: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  start: number,
  { giveUpMs = Infinity }: { giveUpMs?: number } = {},
) {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(true)
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const el = frame.current
    if (!el) return
    const send = (func: string, args: unknown[] = []) =>
      el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')

    const debug = debugOn()
    const log = (...a: unknown[]) => debug && console.info('[clip]', ...a)

    // 플레이어가 준비될 때까지 '듣고 있다'를 몇 번 보낸다. 첫 답이 오면 상태 알림을 구독하고 멈춘다.
    let heard = false
    let played = false
    let buffering = false
    let lastTime = -1
    const hello = () => el.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'clip', channel: 'widget' }), '*')
    const timer = window.setInterval(() => (heard ? window.clearInterval(timer) : hello()), 500)
    const giveUp = Number.isFinite(giveUpMs)
      ? window.setTimeout(function check() {
          if (played) return
          // 버퍼링 중이면 한 번 더 기다린다
          if (buffering) {
            buffering = false
            giveUpTimer = window.setTimeout(check, giveUpMs)
            return
          }
          log('give up: no playing state')
          setGaveUp(true)
        }, giveUpMs)
      : 0
    let giveUpTimer = giveUp
    el.addEventListener('load', hello)

    const markPlaying = () => {
      if (!played) log('playing')
      played = true
      setPlaying(true)
      setPaused(false)
    }

    const onMessage = (e: MessageEvent) => {
      if (e.source !== el.contentWindow && !YT_ORIGIN.test(e.origin)) return
      let data: { event?: string; info?: unknown } | null = null
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      if (!data || typeof data !== 'object') return
      if (!heard) {
        heard = true
        send('addEventListener', ['onStateChange'])
        send('addEventListener', ['onError'])
      }
      log(data.event, data.info)
      if (data.event === 'onError') {
        log('error', data.info)
        setGaveUp(true)
        return
      }
      const info = typeof data.info === 'object' && data.info ? (data.info as { playerState?: number; currentTime?: number }) : null
      const state = data.event === 'onStateChange' ? data.info : info?.playerState
      // 상태값을 안 주고 시간만 흐르는 경우도 재생으로 본다
      if (typeof info?.currentTime === 'number') {
        if (lastTime >= 0 && info.currentTime > lastTime + 0.05) markPlaying()
        lastTime = info.currentTime
      }
      if (state === 3) buffering = true
      if (state === 1) markPlaying()
      else if (state === 2) setPaused(true)
      // 0 = 종료(end 지점 도달) → 시작으로 되감아 다시 재생
      if (state === 0) {
        send('seekTo', [start, true])
        send('playVideo')
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(giveUpTimer)
      el.removeEventListener('load', hello)
      window.removeEventListener('message', onMessage)
    }
  }, [frame, enabled, start, giveUpMs])

  const toggle = () => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    )
    setPaused(!paused) // 플레이어가 상태를 알려 오면 그 값으로 다시 맞춰진다
  }

  return { playing, paused, gaveUp, toggle }
}
