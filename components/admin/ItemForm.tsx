'use client'

import { useEffect, useRef, useState } from 'react'
import type { PortfolioItem } from '@/types'

const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-accent transition-colors'
const labelCls = 'block text-xs text-text-muted mb-1'

// /en 페이지용 영문 칸. 한국어 칸을 채우고 영문을 비우면 /en에 한국어가 그대로 나온다.
const EN_FIELDS = ['title', 'description', 'problem', 'contribution', 'result', 'metrics', 'highlight', 'role'] as const
// 영문 칸이 빈 것을 알릴 때 키 이름(problem 등) 대신 화면의 칸 이름으로 보여준다
const FIELD_LABELS: Record<(typeof EN_FIELDS)[number], string> = {
  title: '제목', description: '설명', problem: '문제', contribution: '내가 한 것', result: '결과', metrics: '지표', highlight: '홈 결과', role: '홈 역할',
}

type FormState = {
  type: PortfolioItem['type']
  year: string
  title: string
  description: string
  problem: string
  contribution: string
  result: string
  metrics: string
  highlight: string
  role: string
  title_en: string
  description_en: string
  problem_en: string
  contribution_en: string
  result_en: string
  metrics_en: string
  highlight_en: string
  role_en: string
  skills: string
  github: string
  paper: string
  slug: string
  link: string
  thumbnail: string
  video: string
  order: number
  visible: boolean
  featured: boolean
}

function toForm(item: PortfolioItem | null): FormState {
  return {
    type: item?.type ?? 'project',
    year: item?.year ?? '',
    title: item?.title ?? '',
    description: item?.description ?? '',
    problem: item?.problem ?? '',
    contribution: item?.contribution ?? '',
    result: item?.result ?? '',
    metrics: item?.metrics ?? '',
    highlight: item?.highlight ?? '',
    role: item?.role ?? '',
    title_en: item?.title_en ?? '',
    description_en: item?.description_en ?? '',
    problem_en: item?.problem_en ?? '',
    contribution_en: item?.contribution_en ?? '',
    result_en: item?.result_en ?? '',
    metrics_en: item?.metrics_en ?? '',
    highlight_en: item?.highlight_en ?? '',
    role_en: item?.role_en ?? '',
    skills: (item?.skills ?? []).join(', '),
    github: item?.github ?? '',
    paper: item?.paper ?? '',
    slug: item?.slug ?? '',
    link: item?.link ?? '',
    thumbnail: item?.thumbnail ?? '',
    video: item?.video ?? '',
    order: item?.order ?? 0,
    visible: item?.visible ?? false,
    featured: item?.featured ?? false,
  }
}

function saveErrorMessage(status: number) {
  if (status === 401) return '저장 실패: 로그인이 만료됐습니다. 다른 탭에서 다시 로그인한 뒤 눌러 주세요 (입력한 내용은 그대로 둡니다).'
  if (status === 400) return '저장 실패: 입력값을 확인해 주세요.'
  if (status === 409) return '저장 실패: 다른 프로젝트가 이미 쓰는 슬러그(주소)입니다. 다른 슬러그를 입력해 주세요.'
  return `저장 실패 (오류 ${status})`
}

interface Props {
  item: PortfolioItem | null
  onSaved: (saved: PortfolioItem) => void
  onCancel: () => void
  registerDirtyCheck: (check: () => boolean) => void
}

// 우측 패널(400px) 안에 들어가므로 칸은 모두 한 줄로 쌓는다. 케이스 스터디 3칸도 세로로.
export default function ItemForm({ item, onSaved, onCancel, registerDirtyCheck }: Props) {
  const [initial] = useState(() => toForm(item))
  const [form, setFormState] = useState(initial)
  // 최신 입력값을 렌더를 기다리지 않고 ref에 둔다 — 입력 직후 바로 Esc를 눌러도 '수정 있음'으로 판단하게(TrackForm과 같은 이유).
  const latest = useRef(initial)
  function setForm(next: FormState | ((f: FormState) => FormState)) {
    const value = typeof next === 'function' ? next(latest.current) : next
    latest.current = value
    setFormState(value)
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    registerDirtyCheck(() => JSON.stringify(latest.current) !== JSON.stringify(initial))
    return () => registerDirtyCheck(() => false)
  }, [registerDirtyCheck, initial])

  const isProject = form.type === 'project'
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.title.trim()) { setError('제목을 입력하세요.'); return }
    if (!form.year.trim()) { setError('시점(연도 또는 연.월)을 입력하세요.'); return }
    const missingEn = EN_FIELDS
      .filter((f) => isProject || f === 'title' || f === 'description')
      .filter((f) => form[f].trim() && !form[`${f}_en`].trim())
    if (missingEn.length > 0 && !confirm(`영문 칸이 비어 있습니다 (${missingEn.map((f) => FIELD_LABELS[f]).join(', ')}).\n/en 페이지에 한국어로 나옵니다. 그래도 저장할까요?`)) return
    setBusy(true)
    setError(null)
    // 비운 칸은 ''로 보낸다 — 서버가 그 키를 지운다(undefined로 보내면 기존 값이 남는다)
    const body = {
      type: form.type,
      year: form.year.trim(),
      title: form.title,
      description: form.description,
      title_en: form.title_en,
      description_en: form.description_en,
      problem_en: isProject ? form.problem_en : undefined,
      contribution_en: isProject ? form.contribution_en : undefined,
      result_en: isProject ? form.result_en : undefined,
      metrics_en: isProject ? form.metrics_en : undefined,
      problem: isProject ? form.problem : undefined,
      contribution: isProject ? form.contribution : undefined,
      result: isProject ? form.result : undefined,
      metrics: isProject ? form.metrics : undefined,
      highlight: isProject ? form.highlight : undefined,
      role: isProject ? form.role : undefined,
      highlight_en: isProject ? form.highlight_en : undefined,
      role_en: isProject ? form.role_en : undefined,
      skills: isProject ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      github: isProject ? form.github : undefined,
      paper: isProject ? form.paper : undefined,
      slug: isProject ? form.slug : undefined,
      link: isProject ? form.link : undefined,
      thumbnail: isProject ? form.thumbnail : undefined,
      video: isProject ? form.video.trim() || undefined : undefined,
      order: isProject ? Number(form.order) || 0 : undefined,
      visible: isProject ? form.visible : undefined,
      featured: isProject ? (form.visible && form.featured) : undefined,
    }
    // 실패(로그인 만료 401 등)하면 패널을 닫지 않고 알린다 — 닫으면 입력한 내용이 저장된 줄 알고 사라진다
    try {
      const res = await fetch('/api/items', {
        method: item ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item ? { id: item.id, ...body } : body),
      })
      if (!res.ok) { setError(saveErrorMessage(res.status)); return }
      const saved: PortfolioItem = item ? { ...item, ...body, id: item.id } : await res.json()
      onSaved(saved)
    } catch {
      setError('저장 실패: 네트워크 오류')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="item-type" className={labelCls}>종류 *</label>
        <select id="item-type" value={form.type} onChange={(e) => set('type', e.target.value as FormState['type'])} className={inputCls}>
          <option value="project">프로젝트</option>
          <option value="activity">활동</option>
          <option value="award">수상</option>
        </select>
      </div>
      <div>
        <label htmlFor="item-year" className={labelCls}>시점 * (연도 또는 연.월)</label>
        <input id="item-year" type="text" value={form.year} placeholder="2025 또는 2025.03" onChange={(e) => set('year', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="item-title" className={labelCls}>제목 *</label>
        <input id="item-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="item-title-en" className={labelCls}>영문 제목 (/en 페이지)</label>
        <input id="item-title-en" type="text" value={form.title_en} onChange={(e) => set('title_en', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="item-desc" className={labelCls}>설명</label>
        <textarea id="item-desc" value={form.description} rows={3} onChange={(e) => set('description', e.target.value)} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label htmlFor="item-desc-en" className={labelCls}>영문 설명</label>
        <textarea id="item-desc-en" value={form.description_en} rows={3} onChange={(e) => set('description_en', e.target.value)} className={`${inputCls} resize-none`} />
      </div>

      {isProject && (
        <>
          <fieldset className="rounded-md border border-border p-3 space-y-3 min-w-0">
            <legend className="px-1 text-xs text-text-secondary">케이스 스터디</legend>
            <p className="text-xs text-text-secondary">하나라도 채우면 소개 페이지가 설명 문단 대신 3분할로 그린다. 전부 비우면 위 설명을 그대로 쓴다.</p>
            <div>
              <label htmlFor="item-problem" className={labelCls}>문제</label>
              <textarea id="item-problem" value={form.problem} rows={3} onChange={(e) => set('problem', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-contribution" className={labelCls}>내가 한 것</label>
              <textarea id="item-contribution" value={form.contribution} rows={3} onChange={(e) => set('contribution', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-result" className={labelCls}>결과</label>
              <textarea id="item-result" value={form.result} rows={3} onChange={(e) => set('result', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-metrics" className={labelCls}>지표 (한 줄에 하나, &quot;값 | 라벨&quot; · 최대 4개)</label>
              <textarea
                id="item-metrics" value={form.metrics} rows={3}
                placeholder={'0.84 → 0.87 | 금융 테스트셋 Macro-F1\n617,611 | 65만 건에서 정제한 리뷰'}
                onChange={(e) => set('metrics', e.target.value)}
                className={`${inputCls} resize-none font-mono`}
              />
            </div>
            <div>
              <label htmlFor="item-problem-en" className={labelCls}>영문 문제</label>
              <textarea id="item-problem-en" value={form.problem_en} rows={3} onChange={(e) => set('problem_en', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-contribution-en" className={labelCls}>영문 내가 한 것</label>
              <textarea id="item-contribution-en" value={form.contribution_en} rows={3} onChange={(e) => set('contribution_en', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-result-en" className={labelCls}>영문 결과</label>
              <textarea id="item-result-en" value={form.result_en} rows={3} onChange={(e) => set('result_en', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label htmlFor="item-metrics-en" className={labelCls}>영문 지표 (줄 수·숫자를 위와 맞춤)</label>
              <textarea id="item-metrics-en" value={form.metrics_en} rows={3} onChange={(e) => set('metrics_en', e.target.value)} className={`${inputCls} resize-none font-mono`} />
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-border p-3 space-y-3 min-w-0">
            <legend className="px-1 text-xs text-text-secondary">홈 카드</legend>
            <p className="text-xs text-text-secondary">홈 대표로 고른 작업의 카드에 두 줄로 나온다. 결과는 밖에서 확인되는 것(수상·게재·사용량), 역할은 팀 규모와 맡은 부분. 결과를 비우면 지표 첫 줄을 쓴다.</p>
            <div>
              <label htmlFor="item-highlight" className={labelCls}>결과 (예: SUMTECH 2026 우수상)</label>
              <input id="item-highlight" type="text" value={form.highlight} onChange={(e) => set('highlight', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="item-role" className={labelCls}>역할 (예: 5인 팀 · 개발 전담)</label>
              <input id="item-role" type="text" value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="item-highlight-en" className={labelCls}>영문 결과</label>
              <input id="item-highlight-en" type="text" value={form.highlight_en} onChange={(e) => set('highlight_en', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="item-role-en" className={labelCls}>영문 역할</label>
              <input id="item-role-en" type="text" value={form.role_en} onChange={(e) => set('role_en', e.target.value)} className={inputCls} />
            </div>
          </fieldset>

          <div>
            <label htmlFor="item-skills" className={labelCls}>기술스택 (쉼표 구분)</label>
            <input id="item-skills" type="text" value={form.skills} placeholder="React, TypeScript" onChange={(e) => set('skills', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="item-order" className={labelCls}>정렬 순서</label>
            <input id="item-order" type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value))} className={inputCls} />
          </div>
          <div className="space-y-2 rounded-md border border-border p-3">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox" checked={form.visible}
                onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked, featured: e.target.checked && f.featured }))}
              />
              소개에 노출
            </label>
            <label className={`flex items-center gap-2 text-sm ${form.visible ? 'text-text-primary' : 'text-text-muted'}`}>
              <input type="checkbox" checked={form.featured} disabled={!form.visible} onChange={(e) => set('featured', e.target.checked)} />
              홈 대표 (소개 노출 중에서)
            </label>
          </div>
          <div>
            <label htmlFor="item-github" className={labelCls}>GitHub URL</label>
            <input id="item-github" type="text" value={form.github} placeholder="https://github.com/..." onChange={(e) => set('github', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="item-paper" className={labelCls}>논문 링크 URL</label>
            <input id="item-paper" type="text" value={form.paper} placeholder="https://www.dbpia.co.kr/..." onChange={(e) => set('paper', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="item-thumbnail" className={labelCls}>그림 경로 (상세 페이지 상단 · 예: /figures/ctf-solver-mcp.svg)</label>
            <input id="item-thumbnail" type="text" value={form.thumbnail} placeholder="/figures/....svg" onChange={(e) => set('thumbnail', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="item-video" className={labelCls}>영상 (그림 아래 · 유튜브 주소 또는 /videos/....mp4 · 구간은 &t=시작초&end=끝초)</label>
            <input id="item-video" type="text" value={form.video} placeholder="https://youtu.be/..." onChange={(e) => set('video', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="item-slug" className={labelCls}>상세 주소 슬러그 (예: finbert-vs-llm · 비우면 id 사용)</label>
            <input id="item-slug" type="text" value={form.slug} placeholder="finbert-vs-llm" onChange={(e) => set('slug', e.target.value)} className={inputCls} />
          </div>
          <div>
            {/* 카드는 github || link 순으로 한 곳만 연결한다 — 둘 다 채우면 link는 안 쓰인다 */}
            <label htmlFor="item-link" className={labelCls}>링크 (GitHub이 비어 있을 때만 카드에 연결됨)</label>
            <input id="item-link" type="text" value={form.link} placeholder="https://..." onChange={(e) => set('link', e.target.value)} className={inputCls} />
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

      <div className="flex gap-2 sticky bottom-0 -mx-4 -mb-4 px-4 py-3 bg-bg-secondary border-t border-border">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded-md border border-border text-text-secondary hover:text-text-primary">
          취소
        </button>
        <button type="submit" disabled={busy} className="flex-1 px-3 py-2 bg-text-primary text-bg text-sm rounded-md disabled:opacity-50">
          {busy ? '저장 중…' : item ? '수정 저장' : '추가'}
        </button>
      </div>
    </form>
  )
}
