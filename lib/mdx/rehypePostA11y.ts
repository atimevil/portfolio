import type { Root } from 'hast'

// 옮겨온 글 본문의 접근성 보정. 저장된 글은 건드리지 않고 그릴 때만 고친다.
//
// 1) 제목 단계: 페이지 제목이 h1인데 본문이 h3부터 시작하는 글이 많다(h2를 건너뜀).
//    본문에서 가장 높은 제목이 h2가 되도록 모든 제목을 같은 폭으로 옮긴다 —
//    제목끼리의 상하 관계는 그대로다. 본문에 h1이 있으면 h2로 내려 페이지에 h1이 하나만 남는다.
// 2) 코드 블록: 가로 스크롤이 생기는 <pre>에 키보드로 들어갈 수 없었다. tabindex=0을 붙인다.
//    rehype-pretty-code가 <pre>를 새로 만들므로 이 플러그인은 그 뒤에 둔다.

interface AnyNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: AnyNode[]
}

const HEADING = /^h([1-6])$/

function collect(node: AnyNode, out: AnyNode[]) {
  if (node.type === 'element' && node.tagName) out.push(node)
  node.children?.forEach((c) => collect(c, out))
}

export default function rehypePostA11y() {
  return (tree: Root) => {
    const els: AnyNode[] = []
    collect(tree as unknown as AnyNode, els)

    const levels = els.map((e) => HEADING.exec(e.tagName!)?.[1]).filter(Boolean).map(Number)
    if (levels.length > 0) {
      const shift = 2 - Math.min(...levels)
      if (shift !== 0) {
        for (const e of els) {
          const lv = HEADING.exec(e.tagName!)?.[1]
          if (lv) e.tagName = `h${Math.min(6, Math.max(2, Number(lv) + shift))}`
        }
      }
    }

    for (const e of els) {
      if (e.tagName === 'pre') e.properties = { ...e.properties, tabIndex: 0 }
    }
  }
}
