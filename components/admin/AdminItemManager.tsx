'use client'

import { useCallback, useRef, useState } from 'react'
import Badge from '@/components/ui/Badge'
import AdminSidePanel, { confirmDiscard } from './AdminSidePanel'
import ItemForm from './ItemForm'
import type { PortfolioItem } from '@/types'

interface Props {
  initialItems: PortfolioItem[]
}

const TYPE_LABEL: Record<PortfolioItem['type'], string> = {
  project: '프로젝트',
  activity: '활동',
  award: '수상',
}

export default function AdminItemManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [panel, setPanel] = useState<{ open: boolean; item: PortfolioItem | null; version: number }>({ open: false, item: null, version: 0 })
  // 열린 폼이 건네준 '저장 안 한 수정 있음?' 함수(음악·책 화면과 같은 방식). 이벤트 처리 중에만 부른다.
  const dirtyCheck = useRef<() => boolean>(() => false)
  const registerDirtyCheck = useCallback((check: () => boolean) => {
    dirtyCheck.current = check
  }, [])
  const isDirty = useCallback(() => dirtyCheck.current(), [])

  function openPanel(item: PortfolioItem | null) {
    if (panel.open && !confirmDiscard(isDirty())) return
    setPanel((p) => ({ open: true, item, version: p.version + 1 }))
  }

  const closePanel = useCallback(() => {
    setPanel((p) => ({ ...p, open: false, item: null }))
  }, [])

  function handleSaved(saved: PortfolioItem) {
    const isNew = !panel.item
    setItems((prev) => (isNew ? [...prev, saved] : prev.map((i) => (i.id === saved.id ? saved : i))))
    // 저장 뒤에도 패널을 열어 둔다 — 저장된 값으로 다시 채워 '수정 저장'이 다시 잠긴다(음악·책과 같다).
    setPanel((p) => ({ open: true, item: saved, version: p.version + 1 }))
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch('/api/items', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => null)
    if (!res?.ok) { alert(res ? deleteErrorMessage(res.status) : '삭제 실패: 네트워크 오류'); return }
    setItems((prev) => prev.filter((i) => i.id !== id))
    // 열어 둔 항목을 지웠으면 패널도 닫는다
    setPanel((p) => (p.item?.id === id ? { open: false, item: null, version: p.version + 1 } : p))
  }

  return (
    <div className="xl:flex xl:gap-4 xl:items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">이력 관리</h1>
          <button type="button" onClick={() => openPanel(null)} className="px-3 py-1.5 bg-text-primary text-bg text-sm rounded-md">
            + 새 항목
          </button>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl divide-y divide-border mb-6">
          {items.length === 0 && (
            <p className="text-center text-text-secondary py-10 text-sm">항목이 없습니다.</p>
          )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between px-5 py-4 transition-colors ${panel.open && panel.item?.id === item.id ? 'bg-accent-soft' : ''}`}
            aria-current={panel.open && panel.item?.id === item.id ? 'true' : undefined}
          >
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
              <button type="button" onClick={() => openPanel(item)} aria-label={`${item.title} 수정`} className="min-h-[36px] px-2 text-xs text-text-secondary hover:text-text-primary transition-colors">수정</button>
              <button type="button" onClick={() => handleDelete(item.id)} aria-label={`${item.title} 삭제`} className="min-h-[36px] px-2 text-xs text-text-secondary hover:text-red-500 transition-colors">삭제</button>
            </div>
          </div>
        ))}
        </div>
      </div>
      <AdminSidePanel open={panel.open} focusKey={panel.version} title={panel.item ? '항목 수정' : '새 항목 추가'} isDirty={isDirty} onClose={closePanel}>
        <ItemForm
          key={`${panel.item?.id ?? 'new'}-${panel.version}`}
          item={panel.item}
          onSaved={handleSaved}
          onCancel={() => { if (confirmDiscard(isDirty())) closePanel() }}
          registerDirtyCheck={registerDirtyCheck}
        />
      </AdminSidePanel>
    </div>
  )
}

function deleteErrorMessage(status: number) {
  if (status === 401) return '삭제 실패: 로그인이 만료됐습니다. 다른 탭에서 다시 로그인한 뒤 눌러 주세요.'
  return `삭제 실패 (오류 ${status})`
}
