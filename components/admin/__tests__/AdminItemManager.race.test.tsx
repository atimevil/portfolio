// @vitest-environment jsdom
// 저장 응답이 오기 전에 패널을 닫거나 다른 줄을 열었을 때, 늦게 온 응답이 패널을 되살리거나 덮어쓰지 않아야 한다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import AdminItemManager from '../AdminItemManager'
import type { PortfolioItem } from '@/types'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ITEMS = [
  { id: 'a', type: 'award', year: '2026', title: '항목A', description: '설명A', title_en: 'A', description_en: 'dA' },
  { id: 'b', type: 'award', year: '2025', title: '항목B', description: '설명B', title_en: 'B', description_en: 'dB' },
] as PortfolioItem[]

let host: HTMLDivElement
let root: Root
let resolveFetch: (r: Response) => void

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia
  vi.stubGlobal('confirm', () => true)
  vi.stubGlobal('alert', () => {})
  vi.stubGlobal('fetch', () => new Promise<Response>((res) => { resolveFetch = res }))
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

const dialog = () => host.querySelector('[role="dialog"]')
const titleInput = () => host.querySelector<HTMLInputElement>('#item-title, input[name="title"]') ?? host.querySelector<HTMLInputElement>('[role="dialog"] input[type="text"]')
const click = (el: Element | null) => act(() => { (el as HTMLElement).click() })
const byLabel = (label: string) => host.querySelector(`[aria-label="${label}"]`)

function type(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function startSave() {
  click(byLabel('항목A 수정'))
  type(titleInput()!, '항목A-수정')
  await act(async () => {
    host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
  })
}

const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 })

describe('AdminItemManager 저장 경합', () => {
  it('저장 중에 패널을 닫으면 응답이 와도 다시 열리지 않는다', async () => {
    await act(async () => { root.render(<AdminItemManager initialItems={ITEMS} />) })
    await startSave()
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(dialog()).toBeNull()
    await act(async () => { resolveFetch(ok()) })
    expect(dialog()).toBeNull()
    // 목록에는 저장된 값이 반영된다
    expect(host.textContent).toContain('항목A-수정')
  })

  it('저장 중에 다른 줄을 열면 응답이 와도 그 줄의 입력을 덮어쓰지 않는다', async () => {
    await act(async () => { root.render(<AdminItemManager initialItems={ITEMS} />) })
    await startSave()
    click(byLabel('항목B 수정'))
    type(titleInput()!, '항목B-입력중')
    await act(async () => { resolveFetch(ok()) })
    expect(titleInput()!.value).toBe('항목B-입력중')
    expect(host.textContent).toContain('항목A-수정')
  })

  it('저장이 끝나면 패널은 열린 채 저장된 값을 보여 주고, 포커스는 첫 칸으로 튀지 않는다', async () => {
    await act(async () => { root.render(<AdminItemManager initialItems={ITEMS} />) })
    await startSave()
    await act(async () => { resolveFetch(ok()) })
    expect(dialog()).not.toBeNull()
    expect(titleInput()!.value).toBe('항목A-수정')
    // 폼이 새 값으로 다시 그려져도 포커스는 첫 칸으로 튀지 않고 패널 자체에 남는다(body로 빠지지도 않는다)
    expect(document.activeElement).toBe(dialog())
    // 저장 결과는 스크린리더에 알린다
    expect(host.querySelector('[role="status"]')?.textContent).toContain('저장했습니다')
  })
})
