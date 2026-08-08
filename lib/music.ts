import { prisma } from '@/lib/prisma'
import type { Track } from '@prisma/client'

export type TrackInput = {
  title: string
  artist: string
  genre?: string | null
  cover?: string | null
  link?: string | null
  memo?: string | null
}

export async function getAllTracks(): Promise<Track[]> {
  return prisma.track.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createTrack(data: TrackInput): Promise<Track> {
  return prisma.track.create({ data: normalize(data) })
}

export async function updateTrack(id: number, data: Partial<TrackInput>): Promise<Track> {
  return prisma.track.update({ where: { id }, data: normalize(data) })
}

export async function deleteTrack(id: number): Promise<void> {
  await prisma.track.delete({ where: { id } })
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
