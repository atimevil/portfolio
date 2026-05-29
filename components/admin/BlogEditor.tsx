'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from './TiptapEditor'
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

function htmlToMarkdown(html: string): string {
  // 기본적인 HTML → Markdown 변환 (Tiptap HTML 기준)
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/g, '$1')
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![]($1)')
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

interface BlogEditorProps {
  initialPost?: BlogPost
}

export default function BlogEditor({ initialPost }: BlogEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [tags, setTags] = useState(initialPost?.tags.join(', ') ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [loading, setLoading] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!initialPost) setSlug(toSlug(value))
  }

  async function submit(status: 'published' | 'draft') {
    if (!title.trim()) { alert('제목을 입력하세요.'); return }
    if (!slug.trim()) { alert('슬러그를 입력하세요.'); return }

    setLoading(true)
    const body = {
      slug: slug.trim(),
      title: title.trim(),
      date: initialPost?.date ?? new Date().toISOString().slice(0, 10),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      excerpt: htmlToMarkdown(content).slice(0, 150),
      content: htmlToMarkdown(content),
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
          className="w-full px-4 py-3 text-xl font-semibold bg-transparent border-b border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">슬러그</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="React, TypeScript, ..."
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <TiptapEditor content={content} onChange={setContent} />

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
