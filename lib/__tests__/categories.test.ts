import { describe, it, expect, beforeEach } from 'vitest'
import { getCategories, addCategory, deleteCategory } from '@/lib/categories'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('categories', () => {
  it('처음엔 빈 배열', async () => {
    expect(await getCategories()).toEqual([])
  })

  it('추가한 순서대로 반환한다', async () => {
    await addCategory('알고리즘')
    await addCategory('자료구조')
    expect(await getCategories()).toEqual(['알고리즘', '자료구조'])
  })

  it('같은 이름을 두 번 추가해도 중복되지 않는다', async () => {
    await addCategory('보안')
    await addCategory('보안')
    expect(await getCategories()).toEqual(['보안'])
  })

  it('빈 문자열은 추가되지 않는다', async () => {
    await addCategory('   ')
    expect(await getCategories()).toEqual([])
  })

  it('삭제하면 목록에서 빠진다', async () => {
    await addCategory('Github')
    await deleteCategory('Github')
    expect(await getCategories()).toEqual([])
  })

  it('존재하지 않는 카테고리를 삭제해도 에러 없이 넘어간다', async () => {
    await expect(deleteCategory('없음')).resolves.toEqual([])
  })
})
