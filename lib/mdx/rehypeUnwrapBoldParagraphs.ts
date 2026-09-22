import type { Root } from 'hast'

// 예전 블로그에서 옮겨온 글은 문단 전체가 <strong>으로 감싸진 채 들어왔다(운영 글 44개 중 32개).
// 이전 글꼴(마루부리)은 굵기를 제대로 그리지 않아 티가 안 났지만, 굵기를 정확히 그리는
// 글꼴에서는 본문이 통째로 굵게 보인다. 그릴 때 "문단 전체를 감싼 굵게"만 풀고,
// 문장 안 일부 강조(<p>…<strong>핵심</strong>…</p>)는 그대로 둔다. 저장된 글은 건드리지 않는다.

interface AnyNode {
  type: string
  tagName?: string
  value?: string
  children?: AnyNode[]
}

const isBlank = (n: AnyNode) => n.type === 'text' && !n.value?.trim()
const isBold = (n: AnyNode) => n.type === 'element' && (n.tagName === 'strong' || n.tagName === 'b')
const isBreak = (n: AnyNode) => n.type === 'element' && n.tagName === 'br'

// 문단의 글자가 전부 굵게 안에 있으면 "통째로 굵은 문단"이다. 옮겨온 글은 한 문단이
// <strong>…</strong><br><strong>…</strong>처럼 굵게 여러 조각으로 쪼개져 있기도 하다.
function isWhollyBold(p: AnyNode): boolean {
  const kids = (p.children ?? []).filter((c) => !isBlank(c) && !isBreak(c))
  return kids.length > 0 && kids.every(isBold)
}

function walk(node: AnyNode) {
  if (!node.children) return
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'p' && isWhollyBold(child)) {
      child.children = (child.children ?? []).flatMap((c) => (isBold(c) ? c.children ?? [] : [c]))
      continue
    }
    walk(child)
  }
}

export default function rehypeUnwrapBoldParagraphs() {
  return (tree: Root) => walk(tree as unknown as AnyNode)
}
