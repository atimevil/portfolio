import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PortfolioItem } from '@/types'

// items.json 대신 메모리 저장소
let store: PortfolioItem[] = []
vi.mock('@/lib/jsonFile', () => ({
  readJsonFile: () => structuredClone(store),
  readJsonFileOr: () => structuredClone(store),
  writeJsonAtomic: (_: string, data: PortfolioItem[]) => { store = structuredClone(data) },
}))

import { updateItem, createItem, slugTaken } from '../items'

beforeEach(() => {
  store = [
    { id: '1', type: 'project', year: '2025', title: 'A', slug: 'alpha', link: 'https://x', visible: true },
    { id: '2', type: 'project', year: '2024', title: 'B', visible: true },
  ] as PortfolioItem[]
})

describe('items', () => {
  it('빈 문자열로 보낸 칸은 지운다', () => {
    updateItem('1', { link: '', title: 'A2' })
    expect(store[0]).not.toHaveProperty('link')
    expect(store[0].title).toBe('A2')
    expect(store[0].slug).toBe('alpha') // 보내지 않은 칸은 그대로
  })

  it('새 항목도 빈 칸은 저장하지 않는다', () => {
    const created = createItem({ type: 'award', year: '2026', title: 'C', description: '' } as Omit<PortfolioItem, 'id'>)
    expect(created).not.toHaveProperty('description')
  })

  it('다른 프로젝트의 slug·id와 겹치면 사용 중', () => {
    expect(slugTaken('alpha')).toBe(true)
    expect(slugTaken('2')).toBe(true) // slug 없는 프로젝트는 id가 주소
    expect(slugTaken('alpha', '1')).toBe(false) // 자기 자신은 제외
    expect(slugTaken('')).toBe(false)
    expect(slugTaken('beta')).toBe(false)
  })
})
