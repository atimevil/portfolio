// 이미지 File을 음악 커버 업로드 API로 올리고 저장된 URL을 돌려준다.
export async function uploadMusicCover(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('type', 'music')
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.')
  const data = await res.json()
  if (!data?.url) throw new Error('업로드 응답에 url이 없습니다.')
  return data.url as string
}
