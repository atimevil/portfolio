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
    // t=90 / t=1m30s 같은 시작 시각은 살린다
    const t = value.match(/[?&#]t=(?:(\d+)m)?(\d+)s?/)
    const start = t ? Number(t[1] ?? 0) * 60 + Number(t[2]) : 0
    const query = new URLSearchParams({ rel: '0', ...(start > 0 ? { start: String(start) } : {}) })
    return { kind: 'youtube', id: yt[1], embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?${query}` }
  }
  if (FILE.test(value)) return { kind: 'file', src: value }
  return null
}
