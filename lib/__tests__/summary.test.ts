import { describe, expect, it } from 'vitest'
import { splitSummary } from '../summary'

describe('splitSummary', () => {
  it('limit 이하면 그대로 두고 나머지는 비운다', () => {
    const short = '조선대 학사 정보를 안내하는 하이브리드 RAG 챗봇.'
    expect(splitSummary(short)).toEqual({ summary: short, rest: '' })
  })

  it('limit 이내의 마지막 문장 경계에서 자른다', () => {
    const text = '첫 문장이다. 두 번째 문장이다. 세 번째 문장이다.'
    // limit 안에 두 문장이 들어가면 둘 다 요약에 넣는다 (limit 이내의 '마지막' 경계)
    const { summary, rest } = splitSummary(text, 20)
    expect(summary).toBe('첫 문장이다. 두 번째 문장이다.')
    expect(rest).toBe('세 번째 문장이다.')
  })

  it('요약과 나머지를 합치면 원문이 복원된다 (내용이 사라지지 않는다)', () => {
    const text = 'A'.repeat(50) + '. ' + 'B'.repeat(50) + '. ' + 'C'.repeat(300)
    const { summary, rest } = splitSummary(text)
    expect(`${summary} ${rest}`).toBe(text)
  })

  it('limit 이내에 문장 경계가 없으면 나누지 않는다', () => {
    const text = '경계없이길게이어지는한문장'.repeat(30)
    expect(splitSummary(text, 50)).toEqual({ summary: text, rest: '' })
  })
})
