import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getAllTracks, createTrack, updateTrack, deleteTrack, updateTracks, deleteTracks } from '@/lib/music'
import { IdsSchema, parseJsonBody, parseJsonObject, badJson } from '@/lib/bulkSchema'
import { hiddenFromPublic } from '@/lib/publicGate'

async function requireSession() {
  const session = await getServerSession()
  return !!session
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const TrackSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  genre: z.string().optional(),
  cover: z.string().optional(),
  link: z.string().optional(),
  memo: z.string().optional(),
  favorite: z.boolean().optional(),
})

// 일괄로 바꿀 수 있는 칸은 장르·즐겨찾기뿐 — 제목·링크를 여러 곡에 덮어쓰는 실수를 API가 막는다.
const TrackBulkSchema = z.object({
  ids: IdsSchema,
  set: z.object({ genre: z.string().optional(), favorite: z.boolean().optional() })
    .strict()
    .refine((s) => Object.keys(s).length > 0, '바꿀 칸이 없습니다'),
})

export async function GET() {
  if (await hiddenFromPublic('music')) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(await getAllTracks())
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const result = TrackSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const track = await createTrack(result.data)
  revalidatePath('/music')
  return NextResponse.json(track, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  const { id, ...updates } = body
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  const result = TrackSchema.partial().safeParse(updates)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  try {
    const track = await updateTrack(id, result.data)
    revalidatePath('/music')
    return NextResponse.json(track)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = TrackBulkSchema.safeParse(await parseJsonBody(req))
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const count = await updateTracks(result.data.ids, result.data.set)
  revalidatePath('/music')
  return NextResponse.json({ count })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const body = (await parseJsonBody(req)) as { id?: unknown; ids?: unknown } | undefined
  if (!body || typeof body !== 'object' || ('id' in body && 'ids' in body)) {
    return NextResponse.json({ error: 'id 또는 ids 중 하나만 보내세요' }, { status: 400 })
  }

  if ('ids' in body) {
    const ids = IdsSchema.safeParse(body.ids)
    if (!ids.success) return NextResponse.json({ error: ids.error.flatten() }, { status: 400 })
    const count = await deleteTracks(ids.data)
    revalidatePath('/music')
    return NextResponse.json({ count })
  }

  if (typeof body.id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  try {
    await deleteTrack(body.id)
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) throw err
  }
  revalidatePath('/music')
  return NextResponse.json({ ok: true })
}
