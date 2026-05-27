import { NextRequest, NextResponse } from 'next/server'
import { getViews, incrementViews } from '@/lib/views'

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  return NextResponse.json({ views: getViews(params.slug) })
}

export async function POST(_: NextRequest, { params }: { params: { slug: string } }) {
  const views = incrementViews(params.slug)
  return NextResponse.json({ views })
}
