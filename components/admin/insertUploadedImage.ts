import type { Editor } from '@tiptap/core'
import { uploadBlogImage } from '@/lib/uploadBlogImage'

// 이미지 File을 업로드하고 에디터 현재 위치에 이미지 노드로 삽입한다(툴바·붙여넣기·끌어놓기·슬래시 명령 공통).
// 편집기 규칙상 이미지를 넣을 수 없는 위치에서는 올린 뒤 삽입만 조용히 실패해 서버에 쓰이지 않는 파일이 남는다 —
// 올리기 전에 먼저 확인한다. (표 칸은 이미지를 허용한다: 브라우저에서 확인함, 2026-11-12.)
const CANNOT_INSERT = '여기에는 이미지를 넣을 수 없습니다. 커서를 다른 곳으로 옮긴 뒤 다시 시도해 주세요.'

export async function insertUploadedImage(editor: Editor, file: File): Promise<void> {
  if (!editor.can().setImage({ src: '/x.png' })) {
    alert(CANNOT_INSERT)
    return
  }
  let url: string
  try {
    url = await uploadBlogImage(file)
  } catch {
    alert('이미지 업로드에 실패했습니다.')
    return
  }
  if (!editor.chain().focus().setImage({ src: url }).run()) alert(CANNOT_INSERT)
}
