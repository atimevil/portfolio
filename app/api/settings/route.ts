import { NextRequest, NextResponse } from 'next/server'
import { parseJsonObject, badJson } from '@/lib/bulkSchema'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getSettings, updateSettings } from '@/lib/settings'

// SiteSettings(types/index.ts)와 같은 모양. 일부만 보내도 되고(병합), 모르는 키는 버린다.
const SettingsSchema = z.object({
  devMode: z.boolean().optional(),
  navVisibility: z
    .object({ gallery: z.boolean().optional(), books: z.boolean().optional(), music: z.boolean().optional() })
    .optional(),
  profile: z
    .object({
      name: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      skills: z.array(z.string()).optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      email: z.string().optional(),
      aboutText: z.string().optional(),
      affiliation: z.string().optional(),
      affiliation_en: z.string().optional(),
      headline: z.string().optional(),
      headline_en: z.string().optional(),
    })
    .optional(),
})

// Without this, Next statically prerenders the GET-only route and the PUT
// handler is never served (PUT → 405 Allow: GET, HEAD), so saving silently fails.
export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = getSettings()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await parseJsonObject(req)
  if (!body) return badJson()
  // 모르는 키가 settings.json에 쌓이지 않게(이 파일은 공개 GET으로도 나간다) 아는 칸만 받는다
  const result = SettingsSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  const updated = updateSettings(result.data)
  return NextResponse.json(updated)
}
