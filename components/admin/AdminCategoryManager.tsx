'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface AdminCategoryManagerProps {
  initialCategories: string[]
  postCounts?: Record<string, number>
}

function failMessage(action: string, status?: number) {
  if (status === 401) return `${action} 실패: 로그인이 만료됐습니다. 다른 탭에서 다시 로그인한 뒤 눌러 주세요.`
  return status ? `${action} 실패 (오류 ${status})` : `${action} 실패: 네트워크 오류`
}

export default function AdminCategoryManager({ initialCategories, postCounts = {} }: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) { alert(failMessage('추가', res.status)); return }
      setCategories(await res.json())
      setInput('')
    } catch {
      alert(failMessage('추가'))
    } finally {
      setSaving(false)
    }
  }

  // 삭제하면 그 카테고리의 글은 '카테고리 없음'이 된다(글은 지워지지 않는다). 되돌릴 수 없어 확인을 받는다.
  async function handleDelete(name: string) {
    const n = postCounts[name] ?? 0
    const detail = n > 0 ? `\n이 카테고리의 글 ${n}개는 '카테고리 없음'이 됩니다(글은 그대로 남습니다).` : ''
    if (!confirm(`'${name}' 카테고리를 삭제할까요?${detail}`)) return
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) { alert(failMessage('삭제', res.status)); return }
      setCategories(await res.json())
    } catch {
      alert(failMessage('삭제'))
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-text-primary mb-7">카테고리 관리</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="카테고리 이름"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        <Button onClick={handleAdd} disabled={saving || !input.trim()}>
          추가
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-text-muted">카테고리가 없습니다.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-bg-secondary">
          {categories.map((cat, i) => (
            <div
              key={cat}
              className={`flex items-center justify-between px-4 py-3 ${
                i < categories.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span className="text-sm text-text-primary">
                {cat}
                <span className="ml-2 text-xs text-text-muted">글 {postCounts[cat] ?? 0}</span>
              </span>
              <button
                onClick={() => handleDelete(cat)}
                aria-label={`${cat} 카테고리 삭제`}
                className="min-h-[36px] px-3 -mr-3 text-xs text-text-muted hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
