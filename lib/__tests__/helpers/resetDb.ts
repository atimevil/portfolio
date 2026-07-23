import { prisma } from '@/lib/prisma'

export async function resetDb(): Promise<void> {
  if (!process.env.DATABASE_URL?.includes('portfolio_test')) {
    throw new Error(
      'resetDb() refused: DATABASE_URL does not point at the test database'
    )
  }

  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
}
