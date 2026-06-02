'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { PortfolioItem } from '@/types'

interface Props {
  initialItems: PortfolioItem[]
}

const TYPE_LABEL: Record<PortfolioItem['type'], string> = {
  project: '프로젝트',
  activity: '활동',
  award: '수상',
}

const EMPTY_FORM = {
  type: 'project' as PortfolioItem['type'],
  year: '',
  title: '',
  description: '',
  skills: '',
  github: '',
  link: '',
  thumbnail: '',
  order: 0,
}

export default function AdminItemManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function startEdit(item: PortfolioItem) {
    setEditId(item.id)
    setForm({
      type: item.type,
      year: item.year,
      title: item.title,
      description: item.description ?? '',
      skills: (item.skills ?? []).join(', '),
      github: item.github ?? '',
      link: item.link ?? '',
      thumbnail: item.thumbnail ?? '',
      order: item.order ?? 0,
    })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return }
    if (!form.year.trim()) { alert('연도를 입력하세요.'); return }
    setLoading(true)
    const isProject = form.type === 'project'
    const body = {
      type: form.type,
      year: form.year.trim(),
      title: form.title,
      description: form.description || undefined,
      skills: isProject ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      github: isProject ? (form.github || undefined) : undefined,
      link: isProject ? (form.link || undefined) : undefined,
      thumbnail: isProject ? (form.thumbnail || undefined) : undefined,
      order: isProject ? Number(form.order) || 0 : undefined,
    }
    if (editId && editId !== 'new') {
      await fetch('/api/items', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...body }),
      })
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...body, id: editId } : i)))
    } else {
      const res = await fetch('/api/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const created = await res.json()
      setItems((prev) => [...prev, created])
    }
    setLoading(false)
    cancelEdit()
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch('/api/items', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const isProject = form.type === 'project'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">이력 관리</h1>
        {editId === null && <Button onClick={() => setEditId('new')}>+ 새 항목</Button>}
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl divide-y divide-border mb-6">
        {items.length === 0 && (
          <p className="text-center text-text-secondary py-10 text-sm">항목이 없습니다.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted tabular-nums">{item.year}</span>
                <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-px">
                  {TYPE_LABEL[item.type]}
                </span>
                <p className="font-medium text-text-primary text-sm truncate">{item.title}</p>
              </div>
              {item.type === 'project' && item.skills && item.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.skills.map((s) => <Badge key={s} variant="skill">{s}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => startEdit(item)} className="text-xs text-text-secondary hover:text-text-primary transition-colors">수정</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-text-secondary hover:text-red-500 transition-colors">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {editId !== null && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4">
            {editId === 'new' ? '새 항목 추가' : '항목 수정'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">종류 *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PortfolioItem['type'] }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
              >
                <option value="project">프로젝트</option>
                <option value="activity">활동</option>
                <option value="award">수상</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">연도 *</label>
              <input
                type="text" value={form.year} placeholder="2025"
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-text-muted mb-1">제목 *</label>
              <input
                type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-text-muted mb-1">설명</label>
              <textarea
                value={form.description} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors resize-none"
              />
            </div>

            {isProject && (
              <>
                <div>
                  <label className="block text-xs text-text-muted mb-1">기술스택 (쉼표 구분)</label>
                  <input
                    type="text" value={form.skills} placeholder="React, TypeScript"
                    onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">정렬 순서</label>
                  <input
                    type="number" value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">GitHub URL</label>
                  <input
                    type="text" value={form.github} placeholder="https://github.com/..."
                    onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">링크</label>
                  <input
                    type="text" value={form.link} placeholder="https://..."
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={cancelEdit}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? '저장 중...' : '저장'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
