# 프로젝트·활동·수상 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트·활동·수상을 단일 `PortfolioItem` 모델(`content/items.json`)로 통합하고, admin 단일 화면에서 관리하며, About에서 프로젝트를 카드+타임라인 양쪽에 노출한다.

**Architecture:** 단일 JSON 배열을 `lib/items.ts`가 읽고 `getProjects()`(type=project)·`getTimeline()`(전체, 연도 desc) 헬퍼를 제공한다. admin은 `/api/items` 하나로 CRUD. About은 두 헬퍼로 렌더.

**Tech Stack:** Next.js 14 (App Router, RSC), TypeScript, Tailwind, zod, next-auth. 콘텐츠는 `content/` 볼륨의 JSON(런타임 fs 읽기). **테스트 러너 없음** — 검증은 Docker 빌드(`next build` = tsc+lint)와 라이브 `curl`.

> **검증 메모:** 호스트에 `node_modules`가 없어 로컬 `tsc`가 안 된다. 빠른 타입체크를 위해 Task 0에서 `npm ci`를 1회 실행하면 이후 `npm run typecheck`/`npm run lint`로 태스크별 검증이 가능하다. 최종 반영은 `sudo docker compose up -d --build`.

---

## File Structure

- Create: `lib/items.ts` — items.json CRUD + `getProjects()` + `getTimeline()`
- Create: `app/api/items/route.ts` — GET/POST/PUT/DELETE
- Create: `components/admin/AdminItemManager.tsx` — 통합 관리 폼(type 선택, project 전용 필드 조건부)
- Create: `app/admin/items/page.tsx` — admin 페이지 래퍼
- Modify: `types/index.ts` — `PortfolioItem` 추가, `SiteSettings.profile`에서 activities/awards 제거
- Modify: `lib/settings.ts` — DEFAULT_SETTINGS에서 activities/awards 제거
- Modify: `components/admin/AdminSettingsForm.tsx` — 활동/수상 섹션·상태·payload 제거
- Modify: `components/admin/AdminLayout.tsx` — nav "프로젝트"(/admin/projects) → "이력"(/admin/items)
- Modify: `components/about/TimelineItem.tsx` — `type` 유니온에 `'프로젝트'` 추가
- Modify: `app/(site)/about/page.tsx` — `lib/items`의 `getProjects()`/`getTimeline()` 사용
- Delete: `lib/projects.ts`, `app/api/projects/route.ts`, `components/admin/AdminProjectManager.tsx`, `app/admin/projects/page.tsx`
- Migrate: `content/items.json` 생성(런타임 데이터, git 미추적)

---

### Task 0: 로컬 의존성 설치(검증용)

**Files:** 없음(호스트 node_modules 설치만)

- [ ] **Step 1: 의존성 설치**

Run: `cd /home/ubuntu/portfolio && npm ci`
Expected: 완료(경고는 무시). 이후 `npm run typecheck`, `npm run lint` 사용 가능.

- [ ] **Step 2: 기준 타입체크 통과 확인**

Run: `npm run typecheck`
Expected: 에러 0 (현재 코드 기준 통과).

---

### Task 1: 타입 모델 추가/정리 (`types/index.ts`)

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: `PortfolioItem` 추가, profile에서 activities/awards 제거**

`Project` 인터페이스는 그대로 두되(삭제 단계까지 참조됨), 아래 `PortfolioItem`를 추가하고 `SiteSettings.profile`의 `activities`/`awards` 줄을 삭제한다.

```ts
export interface PortfolioItem {
  id: string
  type: 'project' | 'activity' | 'award'
  year: string
  title: string
  description?: string
  skills?: string[]
  github?: string
  link?: string
  thumbnail?: string
  order?: number
}
```

`SiteSettings.profile`에서 다음 두 줄 제거:
```ts
    activities: Activity[]
    awards: Activity[]
```
`Activity` 인터페이스는 남겨도 무방(미사용 경고 없음). 

- [ ] **Step 2: 커밋 (다른 파일과 함께 Task 2 끝에 커밋)** — 단독 빌드는 깨질 수 있으므로 Task 2까지 진행 후 검증.

---

### Task 2: `lib/items.ts` 생성 + `lib/settings.ts` 정리 + `lib/projects.ts` 삭제

**Files:**
- Create: `lib/items.ts`
- Modify: `lib/settings.ts`
- Delete: `lib/projects.ts`

- [ ] **Step 1: `lib/items.ts` 작성**

```ts
import fs from 'fs'
import path from 'path'
import type { PortfolioItem } from '@/types'

const FILE = path.join(process.cwd(), 'content/items.json')

function read(): PortfolioItem[] {
  if (!fs.existsSync(FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8')) as PortfolioItem[]
  } catch {
    return []
  }
}

function write(data: PortfolioItem[]): void {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getItems(): PortfolioItem[] {
  return read()
}

/** 프로젝트만, order(없으면 year desc) 정렬 */
export function getProjects(): PortfolioItem[] {
  return read()
    .filter((i) => i.type === 'project')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.year.localeCompare(a.year))
}

/** 전체 항목, 연도 desc 정렬 (타임라인용) */
export function getTimeline(): PortfolioItem[] {
  return read().sort((a, b) => b.year.localeCompare(a.year))
}

export function createItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
  const data = read()
  const newItem: PortfolioItem = { ...item, id: Date.now().toString() }
  write([...data, newItem])
  return newItem
}

export function updateItem(id: string, updates: Partial<PortfolioItem>): void {
  const data = read()
  const idx = data.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error(`Item not found: ${id}`)
  data[idx] = { ...data[idx], ...updates }
  write(data)
}

export function deleteItem(id: string): void {
  write(read().filter((i) => i.id !== id))
}
```

- [ ] **Step 2: `lib/settings.ts` DEFAULT_SETTINGS에서 activities/awards 제거**

`DEFAULT_SETTINGS.profile`에서 아래 두 줄 삭제:
```ts
    activities: [],
    awards: [],
```
(나머지 `getSettings`/`updateSettings` 로직은 그대로. profile 병합은 유지된다.)

- [ ] **Step 3: `lib/projects.ts` 삭제**

Run: `git rm lib/projects.ts`

- [ ] **Step 4: 타입체크**

Run: `npm run typecheck`
Expected: 이 시점엔 `lib/projects` import가 남은 곳(api/projects, admin projects page, about page)에서 에러가 날 수 있다 → Task 3~5에서 정리하므로, **여기서는 lib/items.ts·settings.ts 자체에 에러가 없는지**만 확인(남은 에러는 import 경로뿐이어야 함).

---

### Task 3: API `/api/items` 생성 + `/api/projects` 삭제

**Files:**
- Create: `app/api/items/route.ts`
- Delete: `app/api/projects/route.ts`

- [ ] **Step 1: `app/api/items/route.ts` 작성**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { getItems, createItem, updateItem, deleteItem } from '@/lib/items'

const ItemSchema = z.object({
  type: z.enum(['project', 'activity', 'award']),
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  github: z.string().optional(),
  link: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().optional(),
})

export async function GET() {
  return NextResponse.json(getItems())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = ItemSchema.safeParse(await req.json())
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  return NextResponse.json(createItem(result.data), { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  updateItem(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  deleteItem(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: `/api/projects` 삭제**

Run: `git rm app/api/projects/route.ts`

---

### Task 4: 관리자 통합 화면

**Files:**
- Create: `components/admin/AdminItemManager.tsx`
- Create: `app/admin/items/page.tsx`
- Modify: `components/admin/AdminLayout.tsx`
- Modify: `components/admin/AdminSettingsForm.tsx`
- Delete: `components/admin/AdminProjectManager.tsx`, `app/admin/projects/page.tsx`

- [ ] **Step 1: `components/admin/AdminItemManager.tsx` 작성**

```tsx
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
      setItems((prev) => [...prev, await res.json()])
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
```

- [ ] **Step 2: `app/admin/items/page.tsx` 작성**

```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminItemManager from '@/components/admin/AdminItemManager'
import { getItems } from '@/lib/items'

export default async function AdminItemsPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')
  return (
    <AdminLayout>
      <AdminItemManager initialItems={getItems()} />
    </AdminLayout>
  )
}
```

- [ ] **Step 3: `AdminLayout.tsx` nav 수정**

`navItems` 배열에서
```ts
  { href: '/admin/projects', label: '프로젝트' },
```
를
```ts
  { href: '/admin/items', label: '이력' },
```
로 교체.

- [ ] **Step 4: `AdminSettingsForm.tsx`에서 활동/수상 제거**

이 파일을 열어 다음을 모두 제거한다(읽고 정확히 삭제):
- `activities` / `awards` 관련 useState 및 `emptyActivity`, `addActivity`, `updateActivity`, `removeActivity` 함수
- 저장 payload(`profile`)에서 `activities`, `awards` 필드
- JSX의 "활동", "수상" 섹션 전체

프로필 기본 필드(name/bio/aboutText/skills/github/linkedin/avatar/devMode 등)는 그대로 둔다. 제거 후 미사용 import(예: `Activity` 타입)가 있으면 함께 정리.

- [ ] **Step 5: 구파일 삭제**

Run: `git rm components/admin/AdminProjectManager.tsx app/admin/projects/page.tsx`

---

### Task 5: About 렌더링 통합

**Files:**
- Modify: `components/about/TimelineItem.tsx`
- Modify: `app/(site)/about/page.tsx`

- [ ] **Step 1: `TimelineItem.tsx` type 유니온 확장**

`TimelineItemProps`의
```ts
  type: '활동' | '수상'
```
를
```ts
  type: '활동' | '수상' | '프로젝트'
```
로 변경(다른 코드는 그대로; 뱃지는 `type` 문자열을 그대로 표시).

- [ ] **Step 2: `app/(site)/about/page.tsx` 데이터 소스 교체**

import 교체:
```ts
import { getProjects, getTimeline } from '@/lib/items'
```
(`import { getProjects } from '@/lib/projects'` 제거)

본문 상단:
```ts
  const settings = getSettings()
  const { profile } = settings
  const projects = getProjects()
  const timeline = getTimeline()
  const hasEvents = timeline.length > 0
```
(`profile.activities`/`profile.awards` 기반 `events` 블록 삭제)

타임라인 aside의 `events.map(...)`를 `timeline.map`으로 교체하고 type 라벨을 매핑:
```tsx
                {timeline.map((item) => (
                  <TimelineItem
                    key={item.id}
                    year={item.year}
                    type={item.type === 'project' ? '프로젝트' : item.type === 'award' ? '수상' : '활동'}
                    title={item.title}
                    description={item.description}
                  />
                ))}
```
프로젝트 카드 섹션(`projects.map`)은 필드 접근이 동일(`PortfolioItem`이 `name` 대신 `title` 사용 주의!)하도록 수정: 카드의 `project.name` → `project.title`로 변경. 나머지(`description`, `skills`, `github`, `link`, `thumbnail`)는 동일.

> **주의:** `PortfolioItem`은 `name`이 아니라 `title`을 쓴다. 카드 JSX 내 `project.name` 2곳(`<img alt>`, `<h3>`)을 `project.title`로 바꿔야 한다.

---

### Task 6: 콘텐츠 마이그레이션 + 빌드/배포 검증

**Files:**
- Create: `content/items.json` (런타임 데이터, git 미추적)

- [ ] **Step 1: `content/items.json` 작성** (기존 projects.json 3개 + 수상 1개 이관; 프로젝트 연도는 잠정값, 추후 admin/양식으로 보정)

```json
[
  { "id": "1", "type": "project", "year": "2025", "order": 0, "title": "PALLOW",
    "description": "위치 기반 소셜 모임 플랫폼. 알고리즘 친구 추천, 그룹 모임 관리, 실시간 채팅, 관심사 커뮤니티.",
    "skills": ["Java", "Spring", "Docker"], "github": "https://github.com/pallows" },
  { "id": "2", "type": "project", "year": "2025", "order": 1, "title": "Not-Yet — 보안 MCP 서버",
    "description": "화이트햇 스쿨 3기 최종 프로젝트. Kali Linux 침투 테스트 도구와 Perplexity AI 검색을 통합한 MCP 서버.",
    "skills": ["Python", "MCP", "Flask"], "github": "https://github.com/alphateam-mcp" },
  { "id": "3", "type": "project", "year": "2026", "order": 2, "title": "개인 포트폴리오 · 블로그",
    "description": "Next.js로 만든 포트폴리오 겸 블로그. MDX 블로그·갤러리·관리자 CMS·다크모드, Docker·Nginx로 HTTPS 자체 배포.",
    "skills": ["Next.js", "TypeScript", "Tailwind CSS", "Docker"], "github": "https://github.com/atimevil/portfolio", "link": "https://foxibu.is-a.dev" },
  { "id": "4", "type": "award", "year": "2025", "title": "제5회 미래와 소프트웨어 공모전 수상",
    "description": "재단법인 미래와소프트웨어 주최 정보보안 SW 웹·앱 개발 공모전 (전국 98개 대학 204팀)" }
]
```

기존 `content/projects.json`, `content/settings.json`의 awards는 더 이상 읽히지 않으므로 그대로 둬도 무방(원하면 projects.json 삭제).

- [ ] **Step 2: 타입체크 + 린트**

Run: `npm run typecheck && npm run lint`
Expected: 에러 0. (남아있던 `lib/projects` 참조가 모두 제거됐는지 확인)

- [ ] **Step 3: 빌드 + 배포**

Run: `sudo docker compose up -d --build`
Expected: `next build` 성공, 컨테이너 정상.

- [ ] **Step 4: 라이브 검증**

Run:
```
curl -skL https://foxibu.is-a.dev/about | grep -oE 'PALLOW|Not-Yet|미래와 소프트웨어|프로젝트|활동 & 수상'
```
Expected: 프로젝트 카드 3개 + 타임라인(프로젝트/수상 뱃지) 노출.

로그인 후 admin 확인:
```
curl -s -c /tmp/cj -b /tmp/cj "https://foxibu.is-a.dev/api/items" | head -c 200
```
Expected: items 배열 JSON. `/admin/items` 200, `/admin/projects` 404(삭제됨).

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: unify projects/activities/awards into single PortfolioItem model"
```

---

## Self-Review 결과

- **스펙 커버리지:** 데이터모델(Task1·2), lib(Task2), admin 단일화(Task4), API 통일(Task3), About 카드+타임라인(Task5), 마이그레이션(Task6) — 스펙 전 항목 매핑됨.
- **타입 일관성:** `PortfolioItem` 필드명(`title`/`year`/`type`/`skills?`)이 lib·api·admin·about에서 동일 사용. About 카드의 `project.name`→`project.title` 주의 명시(Task5).
- **플레이스홀더:** 없음. AdminSettingsForm 수정(Task4 Step4)은 "읽고 정확히 삭제"로 명시 — 구현 시 파일 확인 필요.
