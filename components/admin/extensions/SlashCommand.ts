import { Extension, type Editor, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { insertUploadedImage } from '../insertUploadedImage'

export interface SlashCommandItem {
  title: string
  description: string
  command: (props: { editor: Editor; range: Range }) => void
}

// range(입력된 "/query" 구간)를 지우고 파일 선택 창을 띄워, 고른 이미지를 툴바 🖼 버튼과 같은 경로로 올려 넣는다.
// (예전엔 여기만 따로 구현해서, 표 칸 안에서는 파일만 올라가고 본문에는 아무것도 안 들어갔다.)
function insertImageViaSlash({ editor, range }: { editor: Editor; range: Range }) {
  editor.chain().focus().deleteRange(range).run()

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'
  // 고르든 취소하든 임시 input은 치운다
  input.addEventListener('cancel', () => input.remove())
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    input.remove()
    if (file) void insertUploadedImage(editor, file)
  })

  document.body.appendChild(input)
  input.click()
}

// 슬래시(`/`) 입력 시 뜨는 명령 목록. 각 command는 range(입력된 "/query" 구간)를
// 지운 뒤 해당 블록 커맨드를 실행한다(Tiptap suggestion 표준 패턴).
const items: SlashCommandItem[] = [
  {
    title: '제목 1',
    description: '가장 큰 섹션 제목',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    title: '제목 2',
    description: '중간 크기 섹션 제목',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    title: '제목 3',
    description: '작은 섹션 제목',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    title: '불릿 목록',
    description: '순서 없는 목록',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: '번호 목록',
    description: '순서 있는 목록',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: '체크박스',
    description: '할 일 목록(체크박스)',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: '인용',
    description: '인용구 블록',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: '이미지',
    description: '이미지 업로드',
    command: insertImageViaSlash,
  },
  {
    title: '코드블록',
    description: '코드 하이라이팅 블록',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: '표',
    description: '3x3 표 삽입',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: '구분선',
    description: '가로 구분선',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: '콜아웃',
    description: '강조 박스(💡)',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCallout().run(),
  },
  {
    title: '토글',
    description: '접고 펼치는 블록',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setToggle().run(),
  },
]

// 제목/설명 부분 일치(대소문자 무시)로 필터링. 빈 쿼리면 전체 목록.
export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  )
}

// RichEditor가 suggestion.render(SlashMenu의 렌더러)를 configure()로 주입한다.
export const SlashCommand = Extension.create<{
  suggestion: Partial<SuggestionOptions<SlashCommandItem, SlashCommandItem>>
}>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        items: ({ query }) => getSlashCommandItems(query),
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
