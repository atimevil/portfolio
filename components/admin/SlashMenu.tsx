'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { SlashCommandItem } from './extensions/SlashCommand'

interface SlashMenuListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export interface SlashMenuListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

// 슬래시 드롭다운 목록 — ↑/↓로 이동, Enter로 선택(Esc는 renderSlashMenu의 onKeyDown에서 팝업을 닫음).
const SlashMenuList = forwardRef<SlashMenuListRef, SlashMenuListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSelectedIndex(0), [items])

  // 선택 항목이 스크롤 영역(max-h) 밖으로 나가면 보이도록 스크롤 — 항목이 많을 때 하이라이트가 사라지는 문제 방지
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) command(item)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((index) => (index + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((index) => (index + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }), [items, selectedIndex])

  if (items.length === 0) {
    return (
      <div className="p-2 text-sm text-text-secondary bg-bg-secondary border border-border rounded-lg shadow-lg">
        일치하는 명령이 없습니다
      </div>
    )
  }

  return (
    <div ref={listRef} className="p-1 min-w-[220px] max-h-72 overflow-y-auto bg-bg-secondary border border-border rounded-lg shadow-lg">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          data-index={index}
          onClick={() => selectItem(index)}
          className={`w-full flex flex-col items-start gap-0.5 px-2 py-1.5 rounded text-left text-sm transition-colors ${
            index === selectedIndex ? 'bg-text-primary text-bg' : 'text-text-primary hover:bg-surface'
          }`}
        >
          <span className="font-medium">{item.title}</span>
          <span className={`text-xs ${index === selectedIndex ? 'text-bg/70' : 'text-text-secondary'}`}>
            {item.description}
          </span>
        </button>
      ))}
    </div>
  )
})
SlashMenuList.displayName = 'SlashMenuList'

// SlashCommand 확장의 suggestion.render로 넘길 팩토리. ReactRenderer로 SlashMenuList를 마운트하고
// tippy.js로 커서 위치에 붙인다(Tiptap 공식 slash-commands/mention 예제 패턴).
export function renderSlashMenu() {
  let component: ReactRenderer<SlashMenuListRef, SlashMenuListProps>
  let popup: TippyInstance[]

  return {
    onStart: (props: SuggestionProps<SlashCommandItem>) => {
      component = new ReactRenderer(SlashMenuList, {
        props,
        editor: props.editor,
      })

      if (!props.clientRect) return

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect as () => DOMRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },

    onUpdate(props: SuggestionProps<SlashCommandItem>) {
      component.updateProps(props)

      if (!props.clientRect) return

      popup[0]?.setProps({
        getReferenceClientRect: props.clientRect as () => DOMRect,
      })
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === 'Escape') {
        popup[0]?.hide()
        return true
      }
      return component.ref?.onKeyDown(props) ?? false
    },

    onExit() {
      popup[0]?.destroy()
      component.destroy()
    },
  }
}
