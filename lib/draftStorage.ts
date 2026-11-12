// 자동저장 초안을 localStorage에 보관하는 순수 로직. Storage를 주입받아 테스트 가능하게 한다.

export interface DraftData {
  title: string
  date: string
  tags: string
  category: string
  content: string
  /** 예전에 저장된 초안에는 없다 */
  excerpt?: string
  /** 이 초안을 쓰기 시작할 때의 서버 글 지문(snapshotFingerprint). 예전 초안에는 없다 */
  base?: string
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

const FIELDS: (keyof DraftData)[] = ['title', 'date', 'tags', 'category', 'content', 'excerpt']

// 저장된 초안이 서버 원본과 의미있게 다른지(= 복구할 만한 미저장 편집이 있는지).
export function draftDiffersFrom(draft: DraftData, server: DraftData): boolean {
  // 초안에 아예 없는 칸(요약 칸이 생기기 전의 초안)은 비교하지 않는다 — 요약이 있는 글마다 복구 배너가 뜬다
  return FIELDS.some((k) => draft[k] !== undefined && draft[k]!.trim() !== (server[k] ?? '').trim())
}

// 서버 글 내용의 짧은 지문. 초안에 같이 적어 두었다가, 다시 열었을 때 서버 글이 그 사이 바뀌었는지 본다.
export function snapshotFingerprint(server: DraftData): string {
  const text = FIELDS.map((k) => (server[k] ?? '').trim()).join('\u0000')
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return `${text.length}:${h.toString(36)}`
}

// 초안을 쓴 뒤에 서버 글이 바뀌었는지(다른 기기에서 고쳐 저장한 경우). 이런 초안을 복구해 저장하면
// 더 새 글을 옛 내용으로 덮어쓴다. 지문이 없는 예전 초안은 알 수 없으니 false.
export function draftIsStale(draft: DraftData, server: DraftData): boolean {
  return draft.base !== undefined && draft.base !== snapshotFingerprint(server)
}
