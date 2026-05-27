import fs from 'fs'
import path from 'path'
import type { Project } from '@/types'

const FILE = path.join(process.cwd(), 'content/projects.json')

function read(): Project[] {
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function write(data: Project[]): void {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getProjects(): Project[] {
  return read().sort((a, b) => a.order - b.order)
}

export function createProject(project: Omit<Project, 'id'>): Project {
  const data = read()
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
  }
  write([...data, newProject])
  return newProject
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const data = read()
  const idx = data.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error(`Project not found: ${id}`)
  data[idx] = { ...data[idx], ...updates }
  write(data)
}

export function deleteProject(id: string): void {
  const data = read().filter((p) => p.id !== id)
  write(data)
}
