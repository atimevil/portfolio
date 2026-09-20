import { describe, expect, it } from 'vitest'
import { hasCaseStudy, parseMetrics } from '../caseStudy'
import type { PortfolioItem } from '@/types'

const base: PortfolioItem = { id: '1', type: 'project', year: '2026', title: 'T' }

describe('hasCaseStudy', () => {
  it('셋 다 비면 false — description 한 문단으로 폴백한다', () => {
    expect(hasCaseStudy(base)).toBe(false)
    expect(hasCaseStudy({ ...base, problem: '   ' })).toBe(false)
  })
  it('하나라도 채워지면 true', () => {
    expect(hasCaseStudy({ ...base, result: '게재' })).toBe(true)
  })
})

describe('parseMetrics', () => {
  it('값과 라벨을 구분자로 가른다', () => {
    expect(parseMetrics('0.84 → 0.87 | 금융 Macro-F1\n617,611 | 정제 리뷰')).toEqual([
      { value: '0.84 → 0.87', label: '금융 Macro-F1' },
      { value: '617,611', label: '정제 리뷰' },
    ])
  })
  it('구분자가 없으면 값만 쓰고 라벨은 비운다', () => {
    expect(parseMetrics('★ 53')).toEqual([{ value: '★ 53', label: '' }])
  })
  it('빈 줄과 값 없는 줄은 버린다', () => {
    expect(parseMetrics('\n  \n | 라벨만 있음\n5 | 다섯')).toEqual([{ value: '5', label: '다섯' }])
  })
  it('없거나 빈 입력은 빈 배열', () => {
    expect(parseMetrics()).toEqual([])
    expect(parseMetrics('')).toEqual([])
  })
  it('4개를 넘기면 잘라서 레이아웃이 무너지지 않게 한다', () => {
    expect(parseMetrics('1|a\n2|b\n3|c\n4|d\n5|e')).toHaveLength(4)
  })
})
