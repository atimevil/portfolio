import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Markdown } from 'tiptap-markdown'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)

// 기존 마크다운 글(contentFormat='markdown')을 무손실 HTML 에디터로 처음 열 때,
// RichEditor와 동일한 확장 구성으로 md→doc→html 을 1회 수행한다.
// (이 변환이 그 글의 유일한 재배열 지점 — 이후 저장은 html 무손실)
export function markdownToEditorHtml(markdown: string): string {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown.configure({ html: true }),
    ],
    content: markdown,
  })
  const html = editor.getHTML()
  editor.destroy()
  return html
}
