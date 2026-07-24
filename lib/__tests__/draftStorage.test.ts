import { describe, it, expect } from 'vitest'
import {
  draftKey, saveDraft, loadDraft, clearDraft, draftDiffersFrom,
  type DraftData, type StorageLike,
} from '@/lib/draftStorage'

function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

const sample: DraftData = { title: 'T', date: '2024-01-01', tags: 'a, b', category: 'cat', content: '본문' }

describe('draftKey', () => {
  it('slug가 없으면 new 키', () => {
    expect(draftKey()).toBe('blog-draft:new')
  })
  it('slug가 있으면 그 slug 키', () => {
    expect(draftKey('hello-world')).toBe('blog-draft:hello-world')
  })
})

describe('save/load/clear', () => {
  it('저장한 초안을 그대로 읽어온다', () => {
    const s = fakeStorage()
    saveDraft(s, 'k', sample)
    expect(loadDraft(s, 'k')).toEqual(sample)
  })
  it('없는 키는 null', () => {
    expect(loadDraft(fakeStorage(), 'nope')).toBeNull()
  })
  it('깨진 JSON은 null (throw 안 함)', () => {
    const s = fakeStorage()
    s.map.set('k', '{not json')
    expect(loadDraft(s, 'k')).toBeNull()
  })
  it('clear하면 사라진다', () => {
    const s = fakeStorage()
    saveDraft(s, 'k', sample)
    clearDraft(s, 'k')
    expect(loadDraft(s, 'k')).toBeNull()
  })
})

describe('draftDiffersFrom', () => {
  it('모든 필드가 같으면 false', () => {
    expect(draftDiffersFrom(sample, { ...sample })).toBe(false)
  })
  it('공백만 다르면 false (trim 비교)', () => {
    expect(draftDiffersFrom({ ...sample, content: '  본문  ' }, sample)).toBe(false)
  })
  it('내용이 실제로 다르면 true', () => {
    expect(draftDiffersFrom({ ...sample, content: '다른 본문' }, sample)).toBe(true)
  })
})
