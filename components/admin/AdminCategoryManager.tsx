'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface AdminCategoryManagerProps {
  initialCategories: string[]
}

export default function AdminCategoryManager({ initialCategories }: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCategories(updated)
      setInput('')
    }
    setSaving(false)
  }

  async function handleDelete(name: string) {
    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCategories(updated)
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
              <span className="text-sm text-text-primary">{cat}</span>
              <button
                onClick={() => handleDelete(cat)}
                className="text-xs text-text-muted hover:text-red-500 transition-colors"
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
