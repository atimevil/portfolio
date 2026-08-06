import { prisma } from '@/lib/prisma'
import type { Restaurant } from '@prisma/client'

export type RestaurantInput = {
  name: string
  lat: number
  lng: number
  address?: string | null
  category?: string | null
  menus?: string | null
  memo?: string | null
  placeId?: string | null
}

export async function getRestaurants(): Promise<Restaurant[]> {
  return prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createRestaurant(data: RestaurantInput): Promise<Restaurant> {
  return prisma.restaurant.create({ data: normalize(data) })
}

export async function updateRestaurant(id: number, data: Partial<RestaurantInput>): Promise<Restaurant> {
  return prisma.restaurant.update({ where: { id }, data: normalize(data) })
}

export async function deleteRestaurant(id: number): Promise<void> {
  await prisma.restaurant.delete({ where: { id } })
}

// 빈 문자열은 null로 저장한다. placeId는 unique라 빈 문자열이 여러 건 들어가면
// 두 번째부터 unique 제약에 걸리므로 특히 중요하다.
function normalize<T extends Partial<RestaurantInput>>(data: T): T {
  const out = { ...data }
  for (const key of ['address', 'category', 'menus', 'memo', 'placeId'] as const) {
    if (key in out && typeof out[key] === 'string' && !(out[key] as string).trim()) {
      ;(out as Record<string, unknown>)[key] = null
    }
  }
  return out
}
