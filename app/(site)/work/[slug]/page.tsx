export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import ProjectDetail from '@/components/work/ProjectDetail'
import { getProjectBySlug, projectSlug } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) return {}
  const slug = projectSlug(project)
  return buildPageMetadata({
    path: `/work/${slug}`,
    title: project.title,
    description: project.result?.trim() || project.description?.trim() || project.title,
    languages: { ko: `/work/${slug}`, en: `/en/work/${slug}` },
  })
}

export default async function WorkDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) notFound()
  return <ProjectDetail project={project} locale="ko" />
}
