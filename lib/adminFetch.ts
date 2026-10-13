// 관리자 일괄 작업 요청. 실패는 화면에 그대로 띄울 한국어 문구를 담은 Error로 던진다.

export function errorMessage(status: number): string {
  if (status === 401) return '로그인이 만료됐습니다. 다시 로그인해 주세요.'
  if (status === 400) return '요청이 올바르지 않습니다.'
  return `오류 ${status}`
}

export async function sendBulk(url: string, method: 'PATCH' | 'DELETE', body: unknown): Promise<number> {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('네트워크 오류입니다. 잠시 후 다시 시도해 주세요.')
  }
  if (!res.ok) throw new Error(errorMessage(res.status))
  const json = (await res.json()) as { count: number }
  return json.count
}
