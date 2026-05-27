'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { Project } from '@/types'

interface AdminProjectManagerProps {
  initialProjects: Project[]
}

const EMPTY_FORM = {
  name: '', description: '', skills: '', github: '', link: '', thumbnail: '', order: 0,
}

export default function AdminProjectManager({ initialProjects }: AdminProjectManagerProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function startEdit(project: Project) {
    setEditId(project.id)
    setForm({
      name: project.name,
      description: project.description,
      skills: project.skills.join(', '),
      github: project.github ?? '',
      link: project.link ?? '',
      thumbnail: project.thumbnail ?? '',
      order: project.order,
    })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('이름을 입력하세요.'); return }
    setLoading(true)
    const body = {
      name: form.name,
      description: form.description,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      github: form.github || undefined,
      link: form.link || undefined,
      thumbnail: form.thumbnail || undefined,
      order: form.order,
    }
    if (editId) {
      await fetch('/api/projects', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...body }),
      })
      setProjects((prev) => prev.map((p) => p.id === editId ? { ...p, ...body } : p))
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const newProject = await res.json()
      setProjects((prev) => [...prev, newProject])
    }
    setLoading(false)
    cancelEdit()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch('/api/projects', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">프로젝트 관리</h1>
        {!editId && (
          <Button onClick={() => setEditId('new')}>+ 새 프로젝트</Button>
        )}
      </div>

      {/* 목록 */}
      <div className="bg-bg-secondary border border-border rounded-xl divide-y divide-border mb-6">
        {projects.length === 0 && (
          <p className="text-center text-text-secondary py-10 text-sm">프로젝트가 없습니다.</p>
        )}
        {projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-text-primary text-sm">{project.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.skills.map((s) => <Badge key={s} variant="skill">{s}</Badge>)}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startEdit(project)} className="text-xs text-text-secondary hover:text-primary transition-colors">수정</button>
              <button onClick={() => handleDelete(project.id)} className="text-xs text-text-secondary hover:text-red-500 transition-colors">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 폼 */}
      {(editId !== null) && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4">
            {editId === 'new' ? '새 프로젝트 추가' : '프로젝트 수정'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: '이름 *', placeholder: '프로젝트명' },
              { key: 'skills', label: '기술스택 (쉼표 구분)', placeholder: 'React, TypeScript' },
              { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/...' },
              { key: 'link', label: '링크', placeholder: 'https://...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-text-muted mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs text-text-muted mb-1">설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={cancelEdit}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
