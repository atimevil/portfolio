export const dynamic = 'force-dynamic'

import { getProjects } from '@/lib/items'
import { buildPageMetadata } from '@/lib/site'
import ProjectCard from '@/components/projects/ProjectCard'

export function generateMetadata() {
  return buildPageMetadata({
    path: '/projects',
    title: '프로젝트',
    description: '진행한 프로젝트 모음',
  })
}

export default function ProjectsPage() {
  const projects = getProjects()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">프로젝트</h1>
        <p className="mt-1 text-sm text-text-secondary">진행한 프로젝트 {projects.length}개</p>
      </header>

      {projects.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">아직 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  )
}
