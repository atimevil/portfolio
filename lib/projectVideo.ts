/**
 * 프로젝트 상세의 영상 칸.
 *
 * 유튜브 주소(어떤 모양이든)는 youtube-nocookie 임베드로, 그 외 .mp4/.webm 경로는 <video>로 건다.
 * 큰 영상 파일을 사이트 서버에 두면 배포·백업이 무거워져서 유튜브(일부 공개)를 먼저 권한다.
 * 알아볼 수 없는 값은 null — 상세에서 아무것도 그리지 않는다.
 */
export type ProjectVideo =
  | { kind: 'youtube'; id: string; embed: string }
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
    return { kind: 'youtube', id: yt[1], embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?${query}` }
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
