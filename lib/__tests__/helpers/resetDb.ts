import { prisma } from '@/lib/prisma'

export async function resetDb(): Promise<void> {
  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
}
