import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSettings, updateSettings } from '@/lib/settings'

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
  const body = await req.json()
  const updated = updateSettings(body)
  return NextResponse.json(updated)
}
