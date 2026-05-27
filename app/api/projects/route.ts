import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/projects'

const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  skills: z.array(z.string()),
  github: z.string().optional(),
  link: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().default(0),
})

export async function GET() {
  const projects = getProjects()
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const result = ProjectSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  const project = createProject(result.data)
  return NextResponse.json(project, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  updateProject(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  deleteProject(id)
  return NextResponse.json({ ok: true })
}
