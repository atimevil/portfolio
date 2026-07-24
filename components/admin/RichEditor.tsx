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
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef } from 'react'
import { uploadBlogImage } from '@/lib/uploadBlogImage'

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
        </div>
      </BubbleMenu>
      <div className="bg-bg">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
