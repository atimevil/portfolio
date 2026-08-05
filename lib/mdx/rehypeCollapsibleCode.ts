import type { Root, Element } from 'hast'

// MDX 트리에는 hast의 ElementContent 외에도 MDX 전용 노드(MdxJsxFlowElement 등)가
// 섞여 들어올 수 있어, 재귀 순회는 정확한 유니언 타입 대신 최소 구조 타입으로 느슨하게 받는다.
interface AnyNode {
  type: string
  tagName?: string
  value?: string
  children?: AnyNode[]
  properties?: Record<string, unknown>
}

function isDeoboqiMarker(node: AnyNode): node is Element {
  return (
    node.type === 'element' &&
    node.tagName === 'p' &&
    node.children?.length === 1 &&
    node.children[0].type === 'text' &&
    node.children[0].value?.trim() === '더보기'
  )
}

function walk(node: AnyNode) {
  if (!node.children) return
  const children = node.children

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isDeoboqiMarker(child)) {
      // 마커 다음의 '의미있는' 형제를 찾는다 (개행이 만든 공백 text 노드는 건너뜀)
      let j = i + 1
      while (j < children.length) {
        const n = children[j]
        if (n.type === 'text' && !n.value?.trim()) {
          j++
          continue
        }
        break
      }
      const next = children[j]

      if (next && next.type === 'element' && next.tagName === 'pre') {
        // 안전한 경우: 더보기 바로 뒤가 코드블록 하나 — 에디터 토글(Toggle 확장)과 같은
        // <details><summary>+[data-toggle-body]> 구조로 변환해 기존 CSS를 그대로 탄다.
        const details: AnyNode = {
          type: 'element',
          tagName: 'details',
          properties: {},
          children: [
            { type: 'element', tagName: 'summary', properties: {}, children: [{ type: 'text', value: '더보기' }] },
            {
              type: 'element',
              tagName: 'div',
              properties: { dataToggleBody: '' },
              children: [next],
            },
          ],
        }
        children.splice(i, j - i + 1, details)
        continue
      }

      // 복잡한 경우(코드가 바로 뒤에 안 붙음): 죽은 "더보기" 텍스트만 제거, 나머지 내용은 그대로 보존
      children.splice(i, 1)
      i--
      continue
    }
    walk(child)
  }
}

// 옛 블로그 플랫폼(티스토리 등)에서 마이그레이션하며 "더보기" 접기 위젯이 기능은 빠지고
// 텍스트만 남은 것을, 코드블록을 감싸는 실제 <details> 접기/펼치기로 되살린다.
export default function rehypeCollapsibleCode() {
  return (tree: Root) => {
    walk(tree)
  }
}
