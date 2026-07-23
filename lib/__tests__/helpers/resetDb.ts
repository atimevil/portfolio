import { prisma } from '@/lib/prisma'

function isTestDatabase(url: string | undefined): boolean {
  if (!url) return false
  try {
    return new URL(url).pathname === '/portfolio_test'
  } catch {
    return false
  }
}

export async function resetDb(): Promise<void> {
  if (!isTestDatabase(process.env.DATABASE_URL)) {
    throw new Error(
      'resetDb() refused: DATABASE_URL does not point at the test database'
    )
  }

  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
}
