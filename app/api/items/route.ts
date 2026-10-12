import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { hiddenFromPublic } from '@/lib/publicGate'
import { getItems, createItem, updateItem, deleteItem, slugTaken } from '@/lib/items'

const ItemSchema = z.object({
  type: z.enum(['project', 'activity', 'award']),
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  // 케이스 스터디 3분할 + 지표. 비우면 소개 페이지가 description 한 문단으로 폴백한다.
  problem: z.string().optional(),
  contribution: z.string().optional(),
  result: z.string().optional(),
  metrics: z.string().optional(),
  // /en 페이지용 영문판 (lib/i18n의 localized가 비어 있으면 한국어로 폴백)
  title_en: z.string().optional(),
  description_en: z.string().optional(),
  problem_en: z.string().optional(),
  contribution_en: z.string().optional(),
  result_en: z.string().optional(),
  metrics_en: z.string().optional(),
  skills: z.array(z.string()).optional(),
  github: z.string().optional(),
  slug: z.string().optional(),
  paper: z.string().optional(),
  link: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().optional(),
  visible: z.boolean().optional(),
  featured: z.boolean().optional(),
})

export async function GET() {
  if (await hiddenFromPublic()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // 비로그인에게는 소개에서 숨긴 프로젝트를 빼고 준다
  const items = getItems()
  if (await getServerSession()) return NextResponse.json(items)
  return NextResponse.json(items.filter((i) => i.type !== 'project' || i.visible))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = ItemSchema.safeParse(await req.json())
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  if (slugTaken(result.data.slug)) return NextResponse.json({ error: 'slug taken' }, { status: 409 })
  return NextResponse.json(createItem(result.data), { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  // 모르는 키나 잘못된 타입이 items.json에 그대로 들어가지 않게 POST와 같은 스키마로 거른다
  const result = ItemSchema.partial().safeParse(updates)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  if (slugTaken(result.data.slug, id)) return NextResponse.json({ error: 'slug taken' }, { status: 409 })
  if (!updateItem(id, result.data)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  deleteItem(id)
  return NextResponse.json({ ok: true })
}
