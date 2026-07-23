import { describe, it, expect, beforeEach } from 'vitest'
import { createPost, getPostBySlug, getAllPosts, getAllPostsAdmin, updatePost, deletePost } from '@/lib/blog'
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

describe('getAllPosts / getAllPostsAdmin', () => {
  beforeEach(async () => {
    await createPost({
      slug: 'published-1', title: 'P1', date: '2024-01-10',
      tags: [], excerpt: 'e', content: '내용', status: 'published',
    })
    await createPost({
      slug: 'draft-1', title: 'D1', date: '2024-01-20',
      tags: [], excerpt: 'e', content: '![img](/a.png)\n본문', status: 'draft',
    })
  })

  it('getAllPosts는 published만 반환한다', async () => {
    const posts = await getAllPosts()
    expect(posts.map((p) => p.slug)).toEqual(['published-1'])
  })

  it('getAllPostsAdmin은 draft/published 전부, 날짜 내림차순으로 반환한다', async () => {
    const posts = await getAllPostsAdmin()
    expect(posts.map((p) => p.slug)).toEqual(['draft-1', 'published-1'])
  })

  it('getAllPostsAdmin은 본문 첫 이미지를 cover로 추출한다', async () => {
    const posts = await getAllPostsAdmin()
    const draft = posts.find((p) => p.slug === 'draft-1')
    expect(draft?.cover).toBe('/a.png')
  })
})

describe('updatePost', () => {
  beforeEach(async () => {
    await createPost({
      slug: 'original', title: 'Original', date: '2024-01-01',
      tags: ['a', 'b'], category: 'cat1', excerpt: 'e', content: 'c', status: 'draft',
    })
  })

  it('필드를 부분 수정할 수 있다', async () => {
    await updatePost('original', { title: 'Updated', status: 'published' })
    const post = await getPostBySlug('original')
    expect(post?.title).toBe('Updated')
    expect(post?.status).toBe('published')
    expect(post?.tags.sort()).toEqual(['a', 'b'])
  })

  it('slug를 바꾸면 새 slug로 조회된다', async () => {
    await updatePost('original', { slug: 'renamed' })
    expect(await getPostBySlug('original')).toBeNull()
    const renamed = await getPostBySlug('renamed')
    expect(renamed?.title).toBe('Original')
  })

  it('tags를 통째로 교체한다', async () => {
    await updatePost('original', { tags: ['c'] })
    const post = await getPostBySlug('original')
    expect(post?.tags).toEqual(['c'])
  })

  it('category를 빈 문자열로 주면 카테고리가 사라진다', async () => {
    await updatePost('original', { category: '' })
    const post = await getPostBySlug('original')
    expect(post?.category).toBeUndefined()
  })

  it('존재하지 않는 slug를 수정하려 하면 에러가 난다', async () => {
    await expect(updatePost('nope', { title: 'x' })).rejects.toThrow('Post not found')
  })
})

describe('deletePost', () => {
  it('글을 삭제한다', async () => {
    await createPost({
      slug: 'to-delete', title: 'T', date: '2024-01-01',
      tags: [], excerpt: 'e', content: 'c', status: 'draft',
    })
    await deletePost('to-delete')
    expect(await getPostBySlug('to-delete')).toBeNull()
  })

  it('존재하지 않는 slug를 삭제해도 에러 없이 넘어간다', async () => {
    await expect(deletePost('nope')).resolves.toBeUndefined()
  })
})
