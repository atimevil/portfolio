import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /** 현재 커서 위치에 콜아웃(💡) 블록을 삽입한다. */
      setCallout: () => ReturnType
    }
  }
}

// 콜아웃 — <div data-callout><div data-callout-emoji>💡</div><div data-callout-body>…</div></div>
// 본문(block+)은 data-callout-body 안에서만 파싱한다(contentElement) — 이모지 div는 고정 표시(항상 💡)라
// 편집 스키마에 포함하지 않고, 파싱 시 무시된 뒤 renderHTML이 매번 새로 그린다.
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
        contentElement: 'div[data-callout-body]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-callout': '' }),
      ['div', { 'data-callout-emoji': '' }, '💡'],
      ['div', { 'data-callout-body': '' }, 0],
    ]
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [{ type: 'paragraph' }],
            })
            .run()
        },
    }
  },
})
