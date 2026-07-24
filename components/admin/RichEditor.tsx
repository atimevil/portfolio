'use client'

import { useEditor, EditorContent, BubbleMenu, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import AutoJoiner from 'tiptap-extension-auto-joiner'
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef } from 'react'
import { uploadBlogImage } from '@/lib/uploadBlogImage'
import { Callout } from './extensions/Callout'
import { Toggle } from './extensions/Toggle'
import { SlashCommand } from './extensions/SlashCommand'
import { renderSlashMenu } from './SlashMenu'

const lowlight = createLowlight(common)

// RichEditor와 왕복(round-trip) 테스트가 공유하는 확장 목록.
// 저장 포맷은 HTML이므로 Placeholder/BubbleMenu 추가는 getHTML() 출력에 영향을 주지 않는다.
export const richEditorExtensions = [
  StarterKit.configure({ codeBlock: false }), // 아래 lowlight 코드블록으로 대체
  CodeBlockLowlight.configure({ lowlight }),
  Underline,
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Placeholder.configure({
    placeholder: "'/' 를 입력해 블록 추가, 또는 그냥 작성…",
  }),
  TextStyle, // Color가 span[style]을 쓰려면 필요(마크 합성)
  Color, // editor.chain().focus().setColor('#e11d48').run() → <span style="color:...">
  Highlight.configure({ multicolor: true }), // toggleHighlight({ color }) → <mark data-color style="background-color:...">
  TaskList, // <ul data-type="taskList">
  TaskItem.configure({ nested: true }), // <li data-type="taskItem" data-checked="true">…(체크박스는 sanitize 후 CSS로만 표시)
  Callout, // <div data-callout><div data-callout-emoji>💡</div><div data-callout-body>…</div></div>
  Toggle, // <details><summary>…</summary><div data-toggle-body>…</div></details> — 공개 페이지는 JS 없이 네이티브로 접힘
  SlashCommand.configure({ suggestion: { render: renderSlashMenu } }), // '/' 입력 시 블록 삽입 드롭다운(제목·목록·표·콜아웃·토글 등)
  GlobalDragHandle.configure({ dragHandleWidth: 24 }), // 블록 hover 시 좌측 드래그 핸들(ProseMirror 플러그인 — getHTML() 출력에 영향 없음)
  AutoJoiner, // 드래그로 붙인 같은 종류 목록을 자동 병합(GlobalDragHandle과 짝 확장)
]

// 툴바/버블 메뉴에 노출할 텍스트 색상 프리셋(6색) — sanitizeHtml의 color 허용 정규식과 무관하게 항상 hex.
export const TEXT_COLOR_PRESETS = [
  { label: '빨강', value: '#e11d48' },
  { label: '주황', value: '#f97316' },
  { label: '초록', value: '#16a34a' },
  { label: '파랑', value: '#2563eb' },
  { label: '보라', value: '#9333ea' },
  { label: '회색', value: '#6b7280' },
]

// 형광펜 프리셋 — Highlight.multicolor는 color를 background-color로 렌더.
export const HIGHLIGHT_COLOR_PRESETS = [
  { label: '노랑', value: '#fef08a' },
  { label: '초록', value: '#bbf7d0' },
  { label: '파랑', value: '#bfdbfe' },
  { label: '분홍', value: '#fbcfe8' },
]

interface RichEditorProps {
  content: string
  onChange: (markdown: string) => void
}

function ToolbarButton({
  onClick, active = false, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active ? 'bg-text-primary text-bg' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
    >
      {children}
    </button>
  )
}

// 색상 프리셋 하나를 나타내는 작은 원형 스와치 버튼(글자색/형광펜 공용).
function ColorSwatchButton({
  color, active, title, onClick,
}: { color: string; active: boolean; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-5 h-5 rounded-full border transition-transform ${
        active ? 'border-text-primary scale-110' : 'border-border hover:scale-110'
      }`}
      style={{ backgroundColor: color }}
    />
  )
}

// 이미지 File을 업로드하고 에디터 현재 위치에 이미지 노드로 삽입한다.
async function insertUploadedImage(editor: Editor, file: File) {
  try {
    const url = await uploadBlogImage(file)
    editor.chain().focus().setImage({ src: url }).run()
  } catch {
    alert('이미지 업로드에 실패했습니다.')
  }
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR 하이드레이션 경고 회피
    extensions: richEditorExtensions,
    content, // HTML 문자열 (BlogEditor가 필요 시 markdownToEditorHtml로 변환해 전달)
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[50vh] p-4 focus:outline-none',
      },
      handlePaste(_view, event) {
        const image = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
        if (!image || !editor) return false
        event.preventDefault()
        void insertUploadedImage(editor, image)
        return true
      },
      handleDrop(_view, event) {
        const image = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'))
        if (!image || !editor) return false
        event.preventDefault()
        void insertUploadedImage(editor, image)
        return true
      },
    },
  })

  // 부모의 content가 밖에서 바뀌면(예: 초안 복구) 에디터에 반영한다.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  if (!editor) return null

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && editor) void insertUploadedImage(editor, file)
    e.target.value = '' // 같은 파일 다시 선택 가능하게
  }

  function addLink() {
    const url = window.prompt('링크 URL 입력:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-bg-secondary">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
            active={editor.isActive('heading', { level })}
            title={`H${level}`}
          >H{level}</ToolbarButton>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록">{'</>'}</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">&ldquo;</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="체크박스 목록">☑</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setCallout().run()} active={editor.isActive('callout')} title="콜아웃">💡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setToggle().run()} active={editor.isActive('toggle')} title="토글">▸</ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="이미지 업로드">🖼</ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="링크">🔗</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="표">⊞</ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="실행취소">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="다시실행">↪</ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
      </div>
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 p-1 rounded-lg border border-border bg-bg-secondary shadow-lg">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><s>S</s></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="인라인 코드">{'</>'}</ToolbarButton>
          <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="링크">🔗</ToolbarButton>
          <div className="w-px h-5 bg-border mx-1" />
          {TEXT_COLOR_PRESETS.map((c) => (
            <ColorSwatchButton
              key={c.value}
              color={c.value}
              active={editor.isActive('textStyle', { color: c.value })}
              title={`글자색: ${c.label}`}
              onClick={() => editor.chain().focus().setColor(c.value).run()}
            />
          ))}
          <ToolbarButton onClick={() => editor.chain().focus().unsetColor().run()} title="글자색 지우기">A</ToolbarButton>
          <div className="w-px h-5 bg-border mx-1" />
          {HIGHLIGHT_COLOR_PRESETS.map((c) => (
            <ColorSwatchButton
              key={c.value}
              color={c.value}
              active={editor.isActive('highlight', { color: c.value })}
              title={`형광펜: ${c.label}`}
              onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}
            />
          ))}
          <ToolbarButton onClick={() => editor.chain().focus().unsetHighlight().run()} active={editor.isActive('highlight')} title="형광펜 지우기">✎</ToolbarButton>
        </div>
      </BubbleMenu>
      <div className="bg-bg">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
