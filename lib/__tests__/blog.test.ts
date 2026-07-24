import { describe, it, expect, beforeEach } from 'vitest'
import { createPost, getPostBySlug, getAllPosts, getAllPostsAdmin, updatePost, deletePost } from '@/lib/blog'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('contentFormat (무손실 html 저장)', () => {
  it('contentFormat 미지정 시 기본 markdown', async () => {
    await createPost({ slug: 'cf-default', title: 'D', date: '2024-02-01', tags: [], excerpt: 'd', content: '# md', status: 'draft' })
    expect((await getPostBySlug('cf-default'))?.contentFormat).toBe('markdown')
  })

  it('html 글은 contentFormat=html로 저장/조회되고 cover를 <img>에서 추출한다', async () => {
    await createPost({
      slug: 'cf-html', title: 'H', date: '2024-02-02', tags: [], excerpt: '요약',
      content: '<p>hi</p><img src="/uploads/blog/x.png" alt="">', status: 'published',
      contentFormat: 'html',
    })
    expect((await getPostBySlug('cf-html'))?.contentFormat).toBe('html')
    const all = await getAllPosts()
    expect(all.find((p) => p.slug === 'cf-html')?.cover).toBe('/uploads/blog/x.png')
  })

  it('updatePost로 markdown→html 전환된다', async () => {
    await createPost({ slug: 'cf-conv', title: 'C', date: '2024-02-03', tags: [], excerpt: 'c', content: '# md', status: 'draft' })
    await updatePost('cf-conv', { content: '<p>now html</p>', contentFormat: 'html' })
    const post = await getPostBySlug('cf-conv')
    expect(post?.contentFormat).toBe('html')
    expect(post?.content).toBe('<p>now html</p>')
  })
})

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

  it('NFD로 정규화된 slug로 조회해도 NFC로 저장된 글을 찾는다', async () => {
    const nfcSlug = '테스트'.normalize('NFC')
    await createPost({
      slug: nfcSlug,
      title: 'NFC 저장 글',
      date: '2024-02-01',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'published',
    })

    const nfdSlug = '테스트'.normalize('NFD')
    const post = await getPostBySlug(nfdSlug)

    expect(post).not.toBeNull()
    expect(post?.title).toBe('NFC 저장 글')
  })

  it('slug를 안 주면 제목에서 자동 생성한다', async () => {
    const slug = await createPost({
      title: 'Auto Generated Title',
      date: '2024-02-01',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'draft',
    })

    expect(slug).toBe('auto-generated-title')
    const post = await getPostBySlug('auto-generated-title')
    expect(post?.title).toBe('Auto Generated Title')
  })

  it('같은 제목으로 여러 번 저장하면 -2, -3 접미사가 붙는다', async () => {
    const base = {
      title: '중복 제목',
      date: '2024-02-01',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'draft' as const,
    }

    expect(await createPost(base)).toBe('중복-제목')
    expect(await createPost(base)).toBe('중복-제목-2')
    expect(await createPost(base)).toBe('중복-제목-3')
  })

  it('제목이 기호뿐이면 post로 폴백하고 그 뒤로도 충돌을 피한다', async () => {
    const base = {
      title: '!!!',
      date: '2024-02-01',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'draft' as const,
    }

    expect(await createPost(base)).toBe('post')
    expect(await createPost(base)).toBe('post-2')
  })

  it('slug를 명시하면 그 값을 그대로 쓴다 (마이그레이션 스크립트 경로)', async () => {
    const slug = await createPost({
      slug: 'explicit-slug',
      title: '완전히 다른 제목',
      date: '2024-02-01',
      tags: [],
      excerpt: '요약',
      content: '내용',
      status: 'draft',
    })

    expect(slug).toBe('explicit-slug')
    expect(await getPostBySlug('explicit-slug')).not.toBeNull()
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

  it('제목을 수정해도 slug는 그대로다', async () => {
    await updatePost('original', { title: '완전히 새로운 제목' })
    const post = await getPostBySlug('original')
    expect(post?.slug).toBe('original')
    expect(post?.title).toBe('완전히 새로운 제목')
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
