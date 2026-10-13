import { prisma } from '@/lib/prisma'
import type { Track } from '@prisma/client'

export type TrackInput = {
  title: string
  artist: string
  genre?: string | null
  cover?: string | null
  link?: string | null
  memo?: string | null
  favorite?: boolean
}

export async function getAllTracks(): Promise<Track[]> {
  return prisma.track.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
}

export async function createTrack(data: TrackInput): Promise<Track> {
  return prisma.track.create({ data: await withCanonicalGenre(normalize(data)) })
}

export async function updateTrack(id: number, data: Partial<TrackInput>): Promise<Track> {
  return prisma.track.update({ where: { id }, data: await withCanonicalGenre(normalize(data)) })
}

export async function deleteTrack(id: number): Promise<void> {
  await prisma.track.delete({ where: { id } })
}

export type TrackBulkSet = { genre?: string | null; favorite?: boolean }

// 여러 곡을 한 번에 고친다. updateMany 한 번이라 일부만 바뀌는 일이 없다. 없는 id는 세지 않는다.
export async function updateTracks(ids: number[], set: TrackBulkSet): Promise<number> {
  const data = await withCanonicalGenre(normalize(set))
  const { count } = await prisma.track.updateMany({ where: { id: { in: ids } }, data })
  return count
}

export async function deleteTracks(ids: number[]): Promise<number> {
  const { count } = await prisma.track.deleteMany({ where: { id: { in: ids } } })
  return count
}

// 빈 문자열은 null로 저장한다 (Place의 normalize()와 동일한 규칙).
function normalize<T extends Partial<TrackInput>>(data: T): T {
  const out = { ...data }
  for (const key of ['genre', 'cover', 'link', 'memo'] as const) {
    if (key in out && typeof out[key] === 'string' && !(out[key] as string).trim()) {
      ;(out as Record<string, unknown>)[key] = null
    }
  }
  return out
}

// 장르를 기존 값의 대소문자에 맞춘다(pop → Pop). 버튼 프리셋이 한글 '팝'이라 DB의 'Pop'과 갈라졌던 일을
// 입력 경로와 상관없이 막는다. 그래서 이미 'Pop'인 장르를 'POP'으로 바꾸는 것도 'Pop'으로 돌아온다.
async function withCanonicalGenre<T extends { genre?: string | null }>(data: T): Promise<T> {
  if (typeof data.genre !== 'string') return data
  const genre = data.genre.trim()
  const hit = await prisma.track.findFirst({
    where: { genre: { equals: genre, mode: 'insensitive' } },
    select: { genre: true },
    orderBy: { id: 'asc' },
  })
  return { ...data, genre: hit?.genre ?? genre }
}
