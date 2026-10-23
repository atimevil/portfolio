import { z } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'

// 일괄 작업 대상. 중복은 지운다 — 화면이 고른 개수와 서버 count를 비교할 때도 중복 제거 후 기준.
export const IdsSchema = z
  .array(z.number().int().positive())
  .min(1)
  .max(500)
  .transform((ids) => [...new Set(ids)])

// 본문이 JSON이 아니면 undefined. req.json()이 던지면 500이 나가던 것을 400으로 돌리려고.
export async function parseJsonBody(req: NextRequest): Promise<unknown | undefined> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

// 본문이 JSON 객체가 아니면(깨진 JSON, null, 배열, 숫자) undefined. 구조 분해하다 던져서 500이 나가던 것을 막는다.
export async function parseJsonObject(req: NextRequest): Promise<Record<string, unknown> | undefined> {
  const body = await parseJsonBody(req)
  return body !== null && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : undefined
}

export function badJson(): NextResponse {
  return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
}
