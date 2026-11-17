import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useRef, useState } from 'react'
import { isImageAlign, isImageWidth, snapImageWidth, type ImageAlign } from '@/lib/imageLayout'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      /** 선택한 이미지를 글 옆(left/right)에 붙이거나 null이면 가운데로 */
      setImageAlign: (align: ImageAlign | null) => ReturnType
      /** 선택한 이미지를 원래 크기(글 폭)·가운데로 되돌린다 */
      resetImageLayout: () => ReturnType
    }
  }
}

// 편집 화면의 이미지: 모서리 손잡이를 끌어 크기를 바꾼다(10% 단위로 맞춰 저장).
function ImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as {
    src: string
    alt?: string
    title?: string
    width: number | null
    align: ImageAlign | null
  }
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const shown = dragWidth ?? width

  function onPointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    const wrap = wrapRef.current
    const container = wrap?.parentElement
    if (!wrap || !container) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = wrap.getBoundingClientRect().width
    const full = container.getBoundingClientRect().width
    // 오른쪽에 붙은 이미지는 손잡이가 왼쪽에 있으니 반대로 끈다
    const dir = align === 'right' ? -1 : 1
    let last: number | null = width
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      last = snapImageWidth(((startW + (ev.clientX - startX) * dir) / full) * 100)
      setDragWidth(last ?? 100)
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
      setDragWidth(null)
      updateAttributes({ width: last })
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  }

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className="image-view"
      data-width={shown && shown < 100 ? shown : undefined}
      data-align={align ?? undefined}
      data-selected={selected ? '' : undefined}
      data-drag-handle
    >
      <img src={src} alt={alt ?? ''} title={title ?? undefined} draggable={false} />
      {editor.isEditable && selected && (
        <>
          <span
            className="image-view__handle"
            data-side={align === 'right' ? 'left' : 'right'}
            onPointerDown={onPointerDown}
            title="끌어서 크기 조절"
          />
          <span className="image-view__badge">{shown && shown < 100 ? `${shown}%` : '글 폭'}</span>
        </>
      )}
    </NodeViewWrapper>
  )
}

// <img data-width="10~90" data-align="left|right"> — 크기·위치는 CSS(.prose img[data-*])가 그린다.
// 글 옆(left/right)에 붙이면 뒤따르는 글이 이미지 옆으로 흐른다(좁은 화면에서는 풀림).
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute('data-width')
          return isImageWidth(v) ? Number(v) : null
        },
        renderHTML: (attrs) => (attrs.width ? { 'data-width': String(attrs.width) } : {}),
      },
      align: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute('data-align')
          return isImageAlign(v) ? v : null
        },
        renderHTML: (attrs) => (attrs.align ? { 'data-align': attrs.align } : {}),
      },
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align) =>
        ({ commands }) =>
          // 글 옆에 붙이면서 글 폭 그대로면 옆에 글이 들어갈 자리가 없으니 40%로 줄인다
          commands.updateAttributes(this.name, {
            align,
            ...(align && !this.editor.getAttributes(this.name).width ? { width: 40 } : {}),
          }),
      resetImageLayout:
        () =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { width: null, align: null }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
})
