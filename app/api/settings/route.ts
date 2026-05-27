import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSettings, updateSettings } from '@/lib/settings'

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
