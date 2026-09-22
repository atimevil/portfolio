import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { localized } from '@/lib/i18n'
import { parseMetrics } from '@/lib/caseStudy'
import type { PortfolioItem } from '@/types'

const base: PortfolioItem = {
  id: 'x',
  type: 'project',
  year: '2026',
  title: '제목',
  description: '설명',
  result: '결과',
  metrics: '20 | 선별 어휘',
  result_en: 'Result',
}

describe('localized', () => {
  it('영문이 있으면 영문, 없으면 한국어로 폴백한다', () => {
    expect(localized(base, 'result', 'en')).toBe('Result')
    expect(localized(base, 'title', 'en')).toBe('제목')
    expect(localized(base, 'result', 'ko')).toBe('결과')
  })

  it('빈 문자열 영문은 없는 것으로 본다', () => {
    expect(localized({ ...base, title_en: '  ' }, 'title', 'en')).toBe('제목')
  })

  it('원문도 없으면 빈 문자열 — 화면에 undefined가 찍히지 않게', () => {
    expect(localized(base, 'problem', 'en')).toBe('')
  })
})

describe('content/items.json 영문판', () => {
  const items: PortfolioItem[] = JSON.parse(fs.readFileSync('content/items.json', 'utf-8'))

  it('모든 항목에 영문 제목이 있다', () => {
    expect(items.filter((i) => !i.title_en?.trim()).map((i) => i.id)).toEqual([])
  })

  it('한국어 칸이 채워져 있으면 영문 칸도 채워져 있다', () => {
    const fields = ['description', 'problem', 'contribution', 'result', 'metrics'] as const
    const missing = items.flatMap((i) =>
      fields.filter((f) => i[f]?.trim() && !i[`${f}_en`]?.trim()).map((f) => `${i.id}.${f}_en`),
    )
    expect(missing).toEqual([])
  })

  it('지표는 줄 수가 같고, 값 안의 숫자가 언어 간에 어긋나지 않는다', () => {
    // 값의 숫자만 비교한다. "8강"→"Top 8"처럼 순위 표현은 번역되지만 숫자(8)는 같아야 한다.
    const nums = (v: string) => (v.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/,/g, ''))
    for (const i of items.filter((x) => x.metrics)) {
      const ko = parseMetrics(i.metrics)
      const en = parseMetrics(i.metrics_en)
      expect(en.length, `${i.id} 줄 수`).toBe(ko.length)
      ko.forEach((m, k) => expect(nums(en[k].value), `${i.id} 지표 ${k}`).toEqual(nums(m.value)))
    }
  })
})
