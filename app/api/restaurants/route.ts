import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import {
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '@/lib/restaurants'

// 맛집지도는 비공개 기능이라 조회(GET)까지 전부 로그인이 필요하다.
async function requireSession() {
  const session = await getServerSession()
  return !!session
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const RestaurantSchema = z.object({
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  category: z.string().optional(),
  menus: z.string().optional(),
  memo: z.string().optional(),
  placeId: z.string().optional(),
})

export async function GET() {
  if (!(await requireSession())) return unauthorized()
  return NextResponse.json(await getRestaurants())
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = RestaurantSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  try {
    return NextResponse.json(await createRestaurant(result.data), { status: 201 })
  } catch (err) {
    // 같은 가게(placeId)를 이미 등록해둔 경우
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '이미 등록된 가게입니다.' }, { status: 409 })
    }
    throw err
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const { id, ...updates } = await req.json()
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  const result = RestaurantSchema.partial().safeParse(updates)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  try {
    return NextResponse.json(await updateRestaurant(id, result.data))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const { id } = await req.json()
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  try {
    await deleteRestaurant(id)
  } catch (err) {
    // 이미 지워진 경우는 성공으로 취급 (멱등)
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) throw err
  }
  return NextResponse.json({ ok: true })
}
