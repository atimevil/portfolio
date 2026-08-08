import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getAllTracks, createTrack, updateTrack, deleteTrack } from '@/lib/music'

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
})

export async function GET() {
  return NextResponse.json(await getAllTracks())
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const result = TrackSchema.safeParse(await req.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  return NextResponse.json(await createTrack(result.data), { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!(await requireSession())) return unauthorized()
  const { id, ...updates } = await req.json()
  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  const result = TrackSchema.partial().safeParse(updates)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  try {
    return NextResponse.json(await updateTrack(id, result.data))
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
    await deleteTrack(id)
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) throw err
  }
  return NextResponse.json({ ok: true })
}
