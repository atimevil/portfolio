export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import ProjectDetail from '@/components/work/ProjectDetail'
import { getProjectBySlug, projectSlug } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import { localized } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) return {}
  const slug = projectSlug(project)
  return buildPageMetadata({
    path: `/en/work/${slug}`,
    title: localized(project, 'title', 'en'),
    description:
      localized(project, 'result', 'en').trim() || localized(project, 'description', 'en').trim() || localized(project, 'title', 'en'),
    languages: { ko: `/work/${slug}`, en: `/en/work/${slug}` },
  })
}

export default async function EnWorkDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug)
  if (!project) notFound()
  return <ProjectDetail project={project} locale="en" />
}
