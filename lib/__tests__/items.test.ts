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

  it('프로젝트를 활동·수상으로 바꾸면 프로젝트 전용 칸을 서버에서 지운다', () => {
    store[0] = { ...store[0], problem: 'p', result: 'r', skills: ['A'], featured: true, order: 3, title_en: 'A-en' } as PortfolioItem
    updateItem('1', { type: 'activity' })
    for (const key of ['problem', 'result', 'skills', 'featured', 'order', 'slug', 'link', 'visible']) {
      expect(store[0]).not.toHaveProperty(key)
    }
    expect(store[0].title_en).toBe('A-en') // 활동·수상도 쓰는 칸은 남는다
    expect(store[0].type).toBe('activity')
  })

  it('원래 수상인 항목을 같은 종류로 저장하면 지표는 건드리지 않는다', () => {
    store[1] = { id: '3', type: 'award', year: '2026', title: 'W', metrics: '8강 | 진출' } as PortfolioItem
    updateItem('3', { type: 'award', title: 'W2' })
    expect(store[1].metrics).toBe('8강 | 진출')
  })

  it('다른 프로젝트의 slug·id와 겹치면 사용 중', () => {
    expect(slugTaken('alpha')).toBe(true)
    expect(slugTaken('2')).toBe(true) // slug 없는 프로젝트는 id가 주소
    expect(slugTaken('alpha', '1')).toBe(false) // 자기 자신은 제외
    expect(slugTaken('')).toBe(false)
    expect(slugTaken('beta')).toBe(false)
  })
})
