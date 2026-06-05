'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import type { BlogPost } from '@/types'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface BlogEditorProps {
  initialPost?: Partial<BlogPost>
  categories: string[]
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors'

export default function BlogEditor({ initialPost, categories }: BlogEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [date, setDate] = useState(initialPost?.date ?? new Date().toISOString().slice(0, 10))
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [category, setCategory] = useState(initialPost?.category ?? '')
  const [loading, setLoading] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!initialPost) setSlug(toSlug(value))
  }

  async function submit(status: 'published' | 'draft') {
    if (!title.trim()) { alert('제목을 입력하세요.'); return }
    if (!slug.trim()) { alert('슬러그를 입력하세요.'); return }

    setLoading(true)
    // 본문은 마크다운 그대로 저장한다 (변환/가공 없음 → 코드블록·이미지·수식 보존)
    const excerpt = content.trim().replace(/\s+/g, ' ').slice(0, 150)
    const body = {
      slug: slug.trim(),
      title: title.trim(),
      date: date.trim() || new Date().toISOString().slice(0, 10),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: category.trim(),
      excerpt,
      content,
      status,
    }

    const payload = initialPost
      ? { originalSlug: initialPost.slug, ...body }
      : body

    const res = await fetch('/api/blog', {
      method: initialPost ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
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
      <div className="flex flex-col gap-4 mb-5">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="제목"
          className="w-full px-4 py-3 text-xl font-semibold bg-transparent border-b border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-text-muted transition-colors"
        />
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-text-muted mb-1">슬러그</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
          </div>
          <div className="w-40">
            <label className="block text-xs text-text-muted mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-text-muted mb-1">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="알고리즘, 그래프, ..."
              className={inputClass}
            />
          </div>
          <div className="w-44">
            <label className="block text-xs text-text-muted mb-1">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">카테고리 없음</option>
              {/* 글에 이미 있는 카테고리가 목록에 없어도 값이 유지되도록 포함 */}
              {(category && !categories.includes(category) ? [category, ...categories] : categories).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <label className="block text-xs text-text-muted mb-1">본문 (마크다운 / MDX)</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        placeholder="# 제목&#10;&#10;마크다운으로 작성하세요. 코드는 ``` 펜스, 수식은 $...$"
        className="w-full min-h-[60vh] px-4 py-3 font-mono text-sm leading-relaxed border border-border rounded-md bg-bg text-text-primary placeholder-text-muted focus:outline-none focus:border-text-muted transition-colors resize-y"
      />

      <div className="flex justify-between mt-5">
        <Button variant="secondary" onClick={() => router.back()} disabled={loading}>
          취소
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => submit('draft')} disabled={loading}>
            임시저장
          </Button>
          <Button onClick={() => submit('published')} disabled={loading}>
            {loading ? '저장 중...' : '발행하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
