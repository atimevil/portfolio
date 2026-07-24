import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggle: {
      /** 현재 커서 위치에 토글(details/summary) 블록을 삽입한다. */
      setToggle: () => ReturnType
    }
  }
}

// 토글 제목 — <summary>…</summary>. 인라인 콘텐츠만(텍스트·굵게 등 인라인 마크는 가능, 블록 불가).
const ToggleSummary = Node.create({
  name: 'toggleSummary',
  content: 'inline*',
  defining: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'summary' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0]
  },
})

// 토글 본문 — <div data-toggle-body>…</div>. 임의 블록 콘텐츠(문단·목록·콜아웃 등).
const ToggleBody = Node.create({
  name: 'toggleBody',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-toggle-body]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-toggle-body': '' }), 0]
  },
})

// 토글 — 네이티브 <details>/<summary>를 그대로 사용해 공개 페이지(정적 렌더, JS 없음)에서도
// 브라우저 기본 접힘/펼침 동작이 동작한다. 제목(toggleSummary)·본문(toggleBody) 두 자식 노드로 구성되며
// addExtensions로 함께 등록되므로 RichEditor는 Toggle 하나만 확장 배열에 추가하면 된다.
export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'toggleSummary toggleBody',
  defining: true,

  parseHTML() {
    return [{ tag: 'details' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0]
  },

  addExtensions() {
    return [ToggleSummary, ToggleBody]
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [
                { type: 'toggleSummary' },
                { type: 'toggleBody', content: [{ type: 'paragraph' }] },
              ],
            })
            .run()
        },
    }
  },
})
