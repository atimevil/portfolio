'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import RichEditor from '@/components/admin/RichEditor'
import {
  draftKey, saveDraft, loadDraft, clearDraft, draftDiffersFrom, type DraftData,
} from '@/lib/draftStorage'
import type { BlogPost } from '@/types'

interface BlogEditorProps {
  initialPost?: Partial<BlogPost>
  categories: string[]
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-accent transition-colors'

export default function BlogEditor({ initialPost, categories }: BlogEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [date, setDate] = useState(initialPost?.date ?? new Date().toISOString().slice(0, 10))
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [category, setCategory] = useState(initialPost?.category ?? '')
  const [loading, setLoading] = useState(false)
  const [recoverable, setRecoverable] = useState<DraftData | null>(null)

  const key = draftKey(initialPost?.slug)
  const serverSnapshot: DraftData = {
    title: initialPost?.title ?? '',
    date: initialPost?.date ?? '',
    tags: initialPost?.tags?.join(', ') ?? '',
    category: initialPost?.category ?? '',
    content: initialPost?.content ?? '',
  }
  const serverRef = useRef(serverSnapshot)

  // 열 때: 저장된 초안이 서버본과 다르면 복구 배너를 띄운다.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = loadDraft(window.localStorage, key)
    if (saved && draftDiffersFrom(saved, serverRef.current)) {
      setRecoverable(saved)
    }
    // key는 마운트 시 고정(같은 글 편집 화면), 의존성 최소화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 편집 중: 디바운스로 자동저장.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (recoverable) return // 복구 배너가 떠 있는 동안은 저장된 초안을 덮어쓰지 않는다
    const draft: DraftData = { title, date, tags, category, content }
    const t = setTimeout(() => saveDraft(window.localStorage, key, draft), 800)
    return () => clearTimeout(t)
  }, [title, date, tags, category, content, key, recoverable])

  function recover() {
    if (!recoverable) return
    setTitle(recoverable.title)
    setDate(recoverable.date)
    setTags(recoverable.tags)
    setCategory(recoverable.category)
    setContent(recoverable.content)
    setRecoverable(null)
  }

  function dismissRecovery() {
    clearDraft(window.localStorage, key)
    setRecoverable(null)
  }

  async function submit(status: 'published' | 'draft') {
    if (!title.trim()) { alert('제목을 입력하세요.'); return }

    setLoading(true)
    // 본문은 마크다운 그대로 저장한다 (변환/가공 없음 → 코드블록·이미지 보존)
    const excerpt = content.trim().replace(/\s+/g, ' ').slice(0, 150)
    const body = {
      title: title.trim(),
      date: date.trim() || new Date().toISOString().slice(0, 10),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: category.trim(),
      excerpt,
      content,
      status,
    }

    const payload = initialPost ? { originalSlug: initialPost.slug, ...body } : body

    const res = await fetch('/api/blog', {
      method: initialPost ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      clearDraft(window.localStorage, key) // 저장 성공 → 초안 폐기
      router.push(`/admin/blog`)
      router.refresh()
    } else {
      alert('저장 실패')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {initialPost ? '글 수정' : '새 글 작성'}
      </h1>

      {recoverable && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <span>저장하지 않은 편집 내용이 있습니다. 복구하시겠어요?</span>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={recover} className="underline font-medium">복구</button>
            <button type="button" onClick={dismissRecovery} className="text-text-muted hover:text-text-secondary">무시</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full px-4 py-3 text-xl font-semibold bg-transparent border-b border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        <div className="flex gap-3 flex-wrap">
          <div className="w-40">
            <label className="block text-xs text-text-muted mb-1">날짜</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-text-muted mb-1">태그 (쉼표로 구분)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="알고리즘, 그래프, ..." className={inputClass} />
          </div>
          <div className="w-44">
            <label className="block text-xs text-text-muted mb-1">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">카테고리 없음</option>
              {(category && !categories.includes(category) ? [category, ...categories] : categories).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <label className="block text-xs text-text-muted mb-1">본문</label>
      <RichEditor content={content} onChange={setContent} />

      <div className="flex justify-between mt-5">
        <Button variant="secondary" onClick={() => router.back()} disabled={loading}>취소</Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => submit('draft')} disabled={loading}>임시저장</Button>
          <Button onClick={() => submit('published')} disabled={loading}>
            {loading ? '저장 중...' : '발행하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
