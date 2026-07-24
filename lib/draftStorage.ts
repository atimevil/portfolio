// 자동저장 초안을 localStorage에 보관하는 순수 로직. Storage를 주입받아 테스트 가능하게 한다.

export interface DraftData {
  title: string
  date: string
  tags: string
  category: string
  content: string
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const PREFIX = 'blog-draft:'

export function draftKey(slug?: string): string {
  return `${PREFIX}${slug ?? 'new'}`
}

export function saveDraft(storage: StorageLike, key: string, draft: DraftData): void {
  try {
    storage.setItem(key, JSON.stringify(draft))
  } catch {
    // best-effort: 용량 초과 등은 무시하고 편집을 막지 않는다.
  }
}

export function loadDraft(storage: StorageLike, key: string): DraftData | null {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as DraftData
  } catch {
    return null
  }
}

export function clearDraft(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

// 저장된 초안이 서버 원본과 의미있게 다른지(= 복구할 만한 미저장 편집이 있는지).
export function draftDiffersFrom(draft: DraftData, server: DraftData): boolean {
  const keys: (keyof DraftData)[] = ['title', 'date', 'tags', 'category', 'content']
  return keys.some((k) => (draft[k] ?? '').trim() !== (server[k] ?? '').trim())
}
