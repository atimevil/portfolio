'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
}

function ToolbarButton({
  onClick, active = false, title, children
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }`}
    >
      {children}
    </button>
  )
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  if (!editor) return null

  function addImage() {
    const url = window.prompt('이미지 URL 입력:')
    if (url) editor?.chain().focus().setImage({ src: url }).run()
  }

  function addLink() {
    const url = window.prompt('링크 URL 입력:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-bg-secondary">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <u>U</u>
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1|2|3 }).run()}
            active={editor.isActive('heading', { level })}
            title={`H${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록">
          {'</>'}
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">
          "
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="이미지">
          🖼
        </ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="링크">
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="표"
        >
          ⊞
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="실행취소">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="다시실행">↪</ToolbarButton>
      </div>

      {/* 에디터 본문 */}
      <div className="bg-bg">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
