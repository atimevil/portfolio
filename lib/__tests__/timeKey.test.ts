import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { timeKey } from '@/lib/items'
import type { PortfolioItem } from '@/types'

describe('timeKey', () => {
  it('연·월·일을 YYYYMMDD로, 빠진 자리는 0', () => {
    expect(timeKey('2025')).toBe(20250000)
    expect(timeKey('2025.03')).toBe(20250300)
    expect(timeKey('2026.09.17')).toBe(20260917)
  })

  it('기간이면 시작일, 뒤에 붙은 표시는 무시', () => {
    expect(timeKey('2026.07.30~31')).toBe(20260730)
    expect(timeKey('2026.01~02')).toBe(20260100)
    expect(timeKey('2026~')).toBe(20260000)
  })

  it('같은 달이면 일로 가른다 (MABC 9/19가 AI Pilot 9/17보다 최근)', () => {
    expect(timeKey('2026.09.19')).toBeGreaterThan(timeKey('2026.09.17'))
    expect(timeKey('2026.09.17')).toBeGreaterThan(timeKey('2026.09'))
  })
})

describe('content/items.json 시점 형식', () => {
  it('모든 항목의 시점이 정렬 가능한 형식이다', () => {
    const items: PortfolioItem[] = JSON.parse(fs.readFileSync('content/items.json', 'utf-8'))
    expect(items.filter((i) => timeKey(i.year) === 0).map((i) => `${i.id}:${i.year}`)).toEqual([])
  })
})
