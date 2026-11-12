// @vitest-environment jsdom
// 글을 쓰고 자동저장 대기 시간(0.8초)이 지나기 전에 저장하면, 저장 성공으로 초안을 지운 뒤에 대기 중이던
// 자동저장이 실행돼 초안이 다시 남았다 — 다음에 "새 글 작성"을 열면 이미 저장한 내용으로 복구 배너가 떴다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import BlogEditor from '../BlogEditor'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}))
// 본문 편집기(Tiptap)는 이 테스트와 무관하다
vi.mock('@/components/admin/RichEditor', () => ({ default: () => null }))
vi.mock('@/lib/markdownToEditorHtml', () => ({ markdownToEditorHtml: (md: string) => md }))

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function typeTitle(text: string) {
  const input = host.querySelector<HTMLInputElement>('input[placeholder="제목"]')!
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function clickButton(label: string) {
  const button = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === label)!
  return act(async () => {
    button.click()
  })
}

describe('BlogEditor 저장 뒤 초안', () => {
  it('입력 직후 저장해도 초안이 다시 남지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, slug: 't' }), { status: 201 })))
    act(() => root.render(<BlogEditor categories={[]} />))

    typeTitle('방금 쓴 제목')
    await clickButton('임시저장') // 자동저장 대기(0.8초)가 끝나기 전
    await act(async () => { vi.advanceTimersByTime(2000) })

    expect(window.localStorage.getItem('blog-draft:new')).toBeNull()
  })

  it('저장에 실패하면 초안은 계속 보관한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    vi.stubGlobal('alert', vi.fn())
    act(() => root.render(<BlogEditor categories={[]} />))

    typeTitle('저장 안 된 제목')
    await clickButton('임시저장')
    await act(async () => { vi.advanceTimersByTime(2000) })

    expect(window.localStorage.getItem('blog-draft:new')).toContain('저장 안 된 제목')
  })
})
