import { describe, it, expect, beforeEach } from 'vitest'
import { createPost, getPostBySlug } from '@/lib/blog'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('createPost + getPostBySlug', () => {
  it('태그·카테고리 포함 글을 저장하고 그대로 읽어온다', async () => {
    await createPost({
      slug: 'hello-world',
      title: 'Hello World',
      date: '2024-01-15',
      tags: ['알고리즘', 'BFS'],
      category: '자료구조',
      excerpt: '요약입니다',
      content: '# 본문\n\n내용',
      status: 'published',
    })

    const post = await getPostBySlug('hello-world')

    expect(post?.slug).toBe('hello-world')
    expect(post?.title).toBe('Hello World')
    expect(post?.date).toBe('2024-01-15')
    expect(post?.tags.sort()).toEqual(['BFS', '알고리즘'].sort())
    expect(post?.category).toBe('자료구조')
    expect(post?.status).toBe('published')
    expect(post?.content).toBe('# 본문\n\n내용')
    expect(post?.cover).toBeUndefined()
  })

  it('카테고리 없이 저장하면 category가 undefined다', async () => {
    await createPost({
      slug: 'no-category',
      title: 'No Category',
      date: '2024-01-16',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'draft',
    })

    const post = await getPostBySlug('no-category')
    expect(post?.category).toBeUndefined()
    expect(post?.tags).toEqual([])
  })

  it('존재하지 않는 slug는 null을 반환한다', async () => {
    const post = await getPostBySlug('nope')
    expect(post).toBeNull()
  })

  it('같은 slug로 두 번 저장하면 에러가 난다', async () => {
    await createPost({
      slug: 'dup',
      title: 'A',
      date: '2024-01-01',
      tags: [],
      excerpt: 'a',
      content: 'a',
      status: 'draft',
    })
    await expect(
      createPost({
        slug: 'dup',
        title: 'B',
        date: '2024-01-01',
        tags: [],
        excerpt: 'b',
        content: 'b',
        status: 'draft',
      })
    ).rejects.toThrow()
  })
})
