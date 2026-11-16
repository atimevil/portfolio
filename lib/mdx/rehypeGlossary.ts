import type { Root } from 'hast'
import type { GlossaryEntry } from '@/lib/glossary'

// 글 안 용어의 첫 등장에 <abbr data-tip="뜻" tabindex="0">를 씌운다. 저장된 글은 건드리지 않고 그릴 때만 붙인다.
// 제목·링크·코드·이미 말풍선인 곳은 건너뛴다. 사전 순서대로 용어마다 한 번만 붙인다.

interface AnyNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: AnyNode[]
}

const SKIP = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre', 'abbr', 'summary', 'script', 'style'])

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 영문·숫자로 시작하거나 끝나는 용어는 다른 단어의 일부(예: OBTAIN 안의 BT)에 붙지 않게 경계를 둔다.
function toRegExp(match: string): RegExp {
  const head = /^[A-Za-z0-9]/.test(match) ? '(?<![A-Za-z0-9])' : ''
  const tail = /[A-Za-z0-9]$/.test(match) ? '(?![A-Za-z0-9])' : ''
  return new RegExp(`${head}${escapeRegExp(match)}${tail}`)
}

// 문서 순서로 첫 번째 일치를 찾아 그 글 노드를 [앞, abbr, 뒤]로 쪼갠다. 붙였으면 true.
function wrapFirst(node: AnyNode, re: RegExp, entry: GlossaryEntry): boolean {
  if (!node.children) return false
  if (node.type === 'element' && node.tagName && SKIP.has(node.tagName)) return false

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === 'text' && typeof child.value === 'string') {
      const m = re.exec(child.value)
      if (!m) continue
      const before = child.value.slice(0, m.index)
      const after = child.value.slice(m.index + m[0].length)
      const abbr: AnyNode = {
        type: 'element',
        tagName: 'abbr',
        properties: { dataTip: entry.tip, tabIndex: 0 },
        children: [{ type: 'text', value: m[0] }],
      }
      const parts: AnyNode[] = []
      if (before) parts.push({ type: 'text', value: before })
      parts.push(abbr)
      if (after) parts.push({ type: 'text', value: after })
      node.children.splice(i, 1, ...parts)
      return true
    }
    if (wrapFirst(child, re, entry)) return true
  }
  return false
}

export default function rehypeGlossary(entries: GlossaryEntry[] = []) {
  return (tree: Root) => {
    for (const entry of entries) wrapFirst(tree as unknown as AnyNode, toRegExp(entry.match), entry)
  }
}
