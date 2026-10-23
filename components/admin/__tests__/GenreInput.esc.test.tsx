// @vitest-environment jsdom
// 자동완성 목록을 Esc로 닫을 때 패널의 'Esc로 닫기'(저장 안 한 수정 확인창)까지 같이 울리지 않아야 한다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import GenreInput from '../GenreInput'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Harness() {
  const [v, setV] = useState('')
  return <GenreInput value={v} onChange={setV} genres={['Pop', 'Rock']} id="g" />
}

let host: HTMLDivElement
let root: Root
const onDocKey = vi.fn()
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<Harness />))
  document.addEventListener('keydown', onDocKey)
  onDocKey.mockClear()
})
afterEach(() => {
  document.removeEventListener('keydown', onDocKey)
  act(() => root.unmount())
  host.remove()
})

const input = () => host.querySelector<HTMLInputElement>('#g')!
const typeText = (v: string) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), v)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
const esc = () => act(() => { input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })

describe('GenreInput Esc', () => {
  it('목록이 열려 있을 수 있는 동안의 첫 Esc는 목록만 닫고 바깥으로 번지지 않는다', () => {
    typeText('P')
    esc()
    expect(onDocKey).not.toHaveBeenCalled()
    esc() // 두 번째 Esc는 패널로 전달된다
    expect(onDocKey).toHaveBeenCalledTimes(1)
  })

  it('입력하지 않았다면 Esc는 바로 바깥으로 전달된다', () => {
    esc()
    expect(onDocKey).toHaveBeenCalledTimes(1)
  })
})
