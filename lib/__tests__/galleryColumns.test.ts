import { describe, it, expect } from 'vitest'
import { distributeColumns } from '@/lib/galleryColumns'

describe('distributeColumns', () => {
  it('순서대로 단에 번갈아 넣어 윗줄이 앞 순서가 된다', () => {
    expect(distributeColumns([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 4, 7], [2, 5], [3, 6]])
  })
  it('사진이 단보다 적으면 남는 단은 비어 있다', () => {
    expect(distributeColumns(['a'], 4)).toEqual([['a'], [], [], []])
  })
  it('단 수가 1보다 작으면 한 단으로 본다', () => {
    expect(distributeColumns([1, 2], 0)).toEqual([[1, 2]])
  })
})
