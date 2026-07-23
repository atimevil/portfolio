import { prisma } from '@/lib/prisma'

export async function getCategories(): Promise<string[]> {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })
  return categories.map((c) => c.name)
}

export async function addCategory(name: string): Promise<string[]> {
  const trimmed = name.trim()
  if (trimmed) {
    await prisma.category.upsert({ where: { name: trimmed }, create: { name: trimmed }, update: {} })
  }
  return getCategories()
}

export async function deleteCategory(name: string): Promise<string[]> {
  await prisma.category.deleteMany({ where: { name } })
  return getCategories()
}
