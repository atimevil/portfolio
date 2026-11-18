import { describe, it, expect } from 'vitest'
import { galleryDateToCreatedAt } from '@/lib/galleryDate'

describe('galleryDateToCreatedAt', () => {
  it('YYYY-MM-DD를 한국 시간 정오로 바꾼다', () => {
    expect(galleryDateToCreatedAt('2025-11-20')).toBe('2025-11-20T03:00:00.000Z')
  })
  it('월초도 한국 시간 기준 같은 달로 남는다', () => {
    expect(galleryDateToCreatedAt('2026-03-01')).toBe('2026-03-01T03:00:00.000Z')
  })
  it('형식이 다르거나 없는 날짜면 null', () => {
    expect(galleryDateToCreatedAt('2025-02-30')).toBeNull()
    expect(galleryDateToCreatedAt('2025-13-01')).toBeNull()
    expect(galleryDateToCreatedAt('2025.11.20')).toBeNull()
    expect(galleryDateToCreatedAt('')).toBeNull()
  })
})
