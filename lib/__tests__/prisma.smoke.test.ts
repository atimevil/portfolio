import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('prisma test DB 연결', () => {
  it('Category를 쓰고 읽을 수 있다', async () => {
    await prisma.category.create({ data: { name: '테스트카테고리' } })
    const found = await prisma.category.findUnique({ where: { name: '테스트카테고리' } })
    expect(found?.name).toBe('테스트카테고리')
  })
})
