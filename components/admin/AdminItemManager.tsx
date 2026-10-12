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

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-accent transition-colors'

// /en 페이지용 영문 칸. 한국어 칸을 채우고 영문을 비우면 /en에 한국어가 그대로 나온다.
const EN_FIELDS = ['title', 'description', 'problem', 'contribution', 'result', 'metrics'] as const

const EMPTY_FORM = {
  type: 'project' as PortfolioItem['type'],
  year: '',
  title: '',
  description: '',
  problem: '',
  contribution: '',
  result: '',
  metrics: '',
  title_en: '',
  description_en: '',
  problem_en: '',
  contribution_en: '',
  result_en: '',
  metrics_en: '',
  skills: '',
  github: '',
  paper: '',
  slug: '',
  link: '',
  thumbnail: '',
  order: 0,
  visible: true,
  featured: false,
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
      problem: item.problem ?? '',
      contribution: item.contribution ?? '',
      result: item.result ?? '',
      metrics: item.metrics ?? '',
      title_en: item.title_en ?? '',
      description_en: item.description_en ?? '',
      problem_en: item.problem_en ?? '',
      contribution_en: item.contribution_en ?? '',
      result_en: item.result_en ?? '',
      metrics_en: item.metrics_en ?? '',
      skills: (item.skills ?? []).join(', '),
      github: item.github ?? '',
      paper: item.paper ?? '',
      slug: item.slug ?? '',
      link: item.link ?? '',
      thumbnail: item.thumbnail ?? '',
      order: item.order ?? 0,
      visible: item.visible ?? false,
      featured: item.featured ?? false,
    })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return }
    if (!form.year.trim()) { alert('시점(연도 또는 연.월)을 입력하세요.'); return }
    const isProject = form.type === 'project'
    const missingEn = EN_FIELDS
      .filter((f) => isProject || f === 'title' || f === 'description')
      .filter((f) => form[f].trim() && !form[`${f}_en`].trim())
    if (missingEn.length > 0 && !confirm(`영문 칸이 비어 있습니다 (${missingEn.join(', ')}).\n/en 페이지에 한국어로 나옵니다. 그래도 저장할까요?`)) return
    setLoading(true)
    const body = {
      type: form.type,
      year: form.year.trim(),
      title: form.title,
      description: form.description || undefined,
      title_en: form.title_en || undefined,
      description_en: form.description_en || undefined,
      problem_en: isProject ? (form.problem_en || undefined) : undefined,
      contribution_en: isProject ? (form.contribution_en || undefined) : undefined,
      result_en: isProject ? (form.result_en || undefined) : undefined,
      metrics_en: isProject ? (form.metrics_en || undefined) : undefined,
      problem: isProject ? (form.problem || undefined) : undefined,
      contribution: isProject ? (form.contribution || undefined) : undefined,
      result: isProject ? (form.result || undefined) : undefined,
      metrics: isProject ? (form.metrics || undefined) : undefined,
      skills: isProject ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      github: isProject ? (form.github || undefined) : undefined,
      paper: isProject ? (form.paper || undefined) : undefined,
      slug: isProject ? (form.slug || undefined) : undefined,
      link: isProject ? (form.link || undefined) : undefined,
      thumbnail: isProject ? (form.thumbnail || undefined) : undefined,
      order: isProject ? Number(form.order) || 0 : undefined,
      visible: isProject ? form.visible : undefined,
      featured: isProject ? (form.visible && form.featured) : undefined,
    }
    // 실패(로그인 만료 401 등)하면 폼을 닫지 않고 알린다 — 닫으면 입력한 내용이 저장된 줄 알고 사라진다
    try {
      const isEdit = editId && editId !== 'new'
      const res = await fetch('/api/items', {
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editId, ...body } : body),
      })
      if (!res.ok) { alert(saveErrorMessage(res.status)); return }
      if (isEdit) {
        setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...body, id: editId } : i)))
      } else {
        const created = await res.json()
        setItems((prev) => [...prev, created])
      }
      cancelEdit()
    } catch {
      alert('저장 실패: 네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch('/api/items', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => null)
    if (!res?.ok) { alert(res ? saveErrorMessage(res.status, '삭제') : '삭제 실패: 네트워크 오류'); return }
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
                {item.type === 'project' && item.featured && (
                  <span className="text-[10px] text-accent border border-accent rounded px-1.5 py-px shrink-0">홈 대표</span>
                )}
                {item.type === 'project' && !item.visible && (
                  <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-px shrink-0">숨김</span>
                )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">종류 *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PortfolioItem['type'] }))}
                className={inputCls}
              >
                <option value="project">프로젝트</option>
                <option value="activity">활동</option>
                <option value="award">수상</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">시점 * (연도 또는 연.월)</label>
              <input
                type="text" value={form.year} placeholder="2025 또는 2025.03"
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">제목 *</label>
              <input
                type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">영문 제목 (/en 페이지)</label>
              <input
                type="text" value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">설명</label>
              <textarea
                value={form.description} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">영문 설명</label>
              <textarea
                value={form.description_en} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
            </div>

            {isProject && (
              <>
                <div className="sm:col-span-2 rounded-md border border-border p-3">
                  <div className="mb-2 text-xs text-text-secondary">
                    케이스 스터디 — 하나라도 채우면 소개 페이지가 설명 문단 대신 3분할로 그린다. 전부 비우면 위 설명을 그대로 쓴다.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">문제</label>
                      <textarea
                        value={form.problem} rows={3}
                        onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">내가 한 것</label>
                      <textarea
                        value={form.contribution} rows={3}
                        onChange={(e) => setForm((f) => ({ ...f, contribution: e.target.value }))}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">결과</label>
                      <textarea
                        value={form.result} rows={3}
                        onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-text-muted mb-1">
                      지표 (한 줄에 하나, &quot;값 | 라벨&quot; · 최대 4개)
                    </label>
                    <textarea
                      value={form.metrics} rows={3}
                      placeholder={'0.84 → 0.87 | 금융 테스트셋 Macro-F1\n617,611 | 65만 건에서 정제한 리뷰'}
                      onChange={(e) => setForm((f) => ({ ...f, metrics: e.target.value }))}
                      className={`${inputCls} resize-none font-mono`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['problem', 'contribution', 'result'] as const).map((f) => (
                      <div key={f}>
                        <label className="block text-xs text-text-muted mb-1">
                          영문 {f === 'problem' ? '문제' : f === 'contribution' ? '내가 한 것' : '결과'}
                        </label>
                        <textarea
                          value={form[`${f}_en`]} rows={3}
                          onChange={(e) => setForm((prev) => ({ ...prev, [`${f}_en`]: e.target.value }))}
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-text-muted mb-1">영문 지표 (줄 수·숫자를 위와 맞춤)</label>
                    <textarea
                      value={form.metrics_en} rows={3}
                      onChange={(e) => setForm((f) => ({ ...f, metrics_en: e.target.value }))}
                      className={`${inputCls} resize-none font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">기술스택 (쉼표 구분)</label>
                  <input
                    type="text" value={form.skills} placeholder="React, TypeScript"
                    onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">정렬 순서</label>
                  <input
                    type="number" value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-border p-3">
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox" checked={form.visible}
                      onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked, featured: e.target.checked && f.featured }))}
                    />
                    소개에 노출
                  </label>
                  <label className={`flex items-center gap-2 text-sm ${form.visible ? 'text-text-primary' : 'text-text-muted'}`}>
                    <input
                      type="checkbox" checked={form.featured} disabled={!form.visible}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    />
                    홈 대표 (소개 노출 중에서)
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">GitHub URL</label>
                  <input
                    type="text" value={form.github} placeholder="https://github.com/..."
                    onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">논문 링크 URL</label>
                  <input
                    type="text" value={form.paper} placeholder="https://www.dbpia.co.kr/..."
                    onChange={(e) => setForm((f) => ({ ...f, paper: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">그림 경로 (상세 페이지 상단 · 예: /figures/ctf-solver-mcp.svg)</label>
                  <input
                    type="text" value={form.thumbnail} placeholder="/figures/....svg"
                    onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">상세 주소 슬러그 (예: finbert-vs-llm · 비우면 id 사용)</label>
                  <input
                    type="text" value={form.slug} placeholder="finbert-vs-llm"
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  {/* 카드는 github || link 순으로 한 곳만 연결한다 — 둘 다 채우면 link는 안 쓰인다 */}
                  <label className="block text-xs text-text-muted mb-1">
                    링크 <span className="text-text-muted">(GitHub이 비어 있을 때만 카드에 연결됨)</span>
                  </label>
                  <input
                    type="text" value={form.link} placeholder="https://..."
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className={inputCls}
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

function saveErrorMessage(status: number, action = '저장') {
  if (status === 401) return `${action} 실패: 로그인이 만료됐습니다. 다른 탭에서 다시 로그인한 뒤 눌러 주세요 (입력한 내용은 그대로 둡니다).`
  if (status === 400) return `${action} 실패: 입력값을 확인해 주세요.`
  return `${action} 실패 (오류 ${status})`
}
