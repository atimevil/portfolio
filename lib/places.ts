import { prisma } from '@/lib/prisma'
import type { Place } from '@prisma/client'

/** 맛집 | 쇼핑 — 같은 지도에 함께 표시하고 탭으로만 구분한다 */
export type PlaceType = 'food' | 'shopping'

export type PlaceInput = {
  type: PlaceType
  name: string
  lat: number
  lng: number
  address?: string | null
  category?: string | null
  items?: string | null
  memo?: string | null
  photo?: string | null
  placeId?: string | null
}

export async function getPlaces(): Promise<Place[]> {
  return prisma.place.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createPlace(data: PlaceInput): Promise<Place> {
  return prisma.place.create({ data: normalize(data) })
}

export async function updatePlace(id: number, data: Partial<PlaceInput>): Promise<Place> {
  return prisma.place.update({ where: { id }, data: normalize(data) })
}

export async function deletePlace(id: number): Promise<void> {
  await prisma.place.delete({ where: { id } })
}

// 빈 문자열은 null로 저장한다. placeId는 unique라 빈 문자열이 여러 건 들어가면
// 두 번째부터 unique 제약에 걸리므로 특히 중요하다.
function normalize<T extends Partial<PlaceInput>>(data: T): T {
  const out = { ...data }
  for (const key of ['address', 'category', 'items', 'memo', 'photo', 'placeId'] as const) {
    if (key in out && typeof out[key] === 'string' && !(out[key] as string).trim()) {
      ;(out as Record<string, unknown>)[key] = null
    }
  }
  return out
}
