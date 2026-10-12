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

// 카테고리 관리 화면에서 삭제 전에 몇 개 글에서 빠지는지 보여주기 위한 글 수(임시글 포함)
export async function getCategoryPostCounts(): Promise<Record<string, number>> {
  const rows = await prisma.category.findMany({ select: { name: true, _count: { select: { posts: true } } } })
  return Object.fromEntries(rows.map((r) => [r.name, r._count.posts]))
}
