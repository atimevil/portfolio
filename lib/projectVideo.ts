/**
 * 프로젝트 상세의 영상 칸.
 *
 * 유튜브 주소(어떤 모양이든)는 youtube-nocookie 임베드로, 그 외 .mp4/.webm 경로는 <video>로 건다.
 * 큰 영상 파일을 사이트 서버에 두면 배포·백업이 무거워져서 유튜브(일부 공개)를 먼저 권한다.
 * 알아볼 수 없는 값은 null — 상세에서 아무것도 그리지 않는다.
 */
export type ProjectVideo =
  | {
      kind: 'youtube'
      id: string
      /** 플레이어 그대로(컨트롤 있음) */
      embed: string
      /** autoplay=1을 붙인 주소: 구간을 소리 없이 자동으로 되풀이하는 장면 모드 */
      clip: boolean
      /** 장면 모드용 임베드 — 컨트롤·자막·관련 영상 없이, 끝에 닿으면 클라이언트가 시작으로 되감는다 */
      clipEmbed: string
      start: number
      end: number
      /** 유튜브에서 그 구간부터 보기 */
      watch: string
    }
  | { kind: 'file'; src: string }

const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
const FILE = /^(?:\/(?!\/)|https:\/\/)[^\s"'<>]+\.(?:mp4|webm)(?:[?#][^\s"'<>]*)?$/i

export function parseVideo(raw: string | undefined): ProjectVideo | null {
  const value = raw?.trim()
  if (!value) return null
  const yt = value.match(YOUTUBE)
  if (yt) {
    // 시작(t= 또는 start=)과 끝(end=)을 살린다. 긴 영상에서 한 장면만 보여 줄 때 쓴다.
    const start = timeParam(value, ['t', 'start'])
    const end = timeParam(value, ['end'])
    const query = new URLSearchParams({ rel: '0' })
    if (start > 0) query.set('start', String(start))
    if (end > start) query.set('end', String(end))
    const id = yt[1]
    const clipQuery = new URLSearchParams({
      autoplay: '1', mute: '1', controls: '0', disablekb: '1', iv_load_policy: '3',
      playsinline: '1', rel: '0', fs: '0', enablejsapi: '1',
    })
    if (start > 0) clipQuery.set('start', String(start))
    if (end > start) clipQuery.set('end', String(end))
    return {
      kind: 'youtube',
      id,
      embed: `https://www.youtube-nocookie.com/embed/${id}?${query}`,
      clip: /[?&#](?:autoplay|loop)=1(?:[&#]|$)/.test(value),
      clipEmbed: `https://www.youtube-nocookie.com/embed/${id}?${clipQuery}`,
      start,
      end: end > start ? end : 0,
      watch: `https://www.youtube.com/watch?v=${id}${start > 0 ? `&t=${start}s` : ''}`,
    }
  }
  if (FILE.test(value)) return { kind: 'file', src: value }
  return null
}

/** 12895 · 12895s · 3h34m55s · 3:34:55 을 초로. 없거나 못 읽으면 0. */
function timeParam(url: string, names: string[]): number {
  for (const name of names) {
    const m = url.match(new RegExp(`[?&#]${name}=([^&#]+)`))
    if (!m) continue
    const v = decodeURIComponent(m[1])
    if (/^\d+s?$/.test(v)) return parseInt(v, 10)
    const hms = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    if (hms && v) return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0)
    const colon = v.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/)
    if (colon) return Number(colon[1] ?? 0) * 3600 + Number(colon[2]) * 60 + Number(colon[3])
  }
  return 0
}

/** 12895 → '3:34:55' */
export function formatClock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}
