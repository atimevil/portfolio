import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '../migrate-posts-to-db'

describe('parseFrontmatter', () => {
  it('정상 프런트매터를 파싱한다', () => {
    const raw = `---
title: "Test Post"
date: "2024-01-01"
tags: ["a", "b"]
category: "cat"
excerpt: "hi"
status: draft
---
Body text`
    const { post, error } = parseFrontmatter('test-post.mdx', raw)
    expect(error).toBeUndefined()
    expect(post?.slug).toBe('test-post')
    expect(post?.title).toBe('Test Post')
    expect(post?.date).toBe('2024-01-01')
    expect(post?.tags).toEqual(['a', 'b'])
    expect(post?.category).toBe('cat')
    expect(post?.status).toBe('draft')
    expect(post?.content.trim()).toBe('Body text')
  })

  it('category 없으면 undefined, status 없으면 published로 기본값', () => {
    const raw = `---
title: "No Category"
date: "2024-01-01"
tags: []
excerpt: "x"
---
Body`
    const { post } = parseFrontmatter('no-category.mdx', raw)
    expect(post?.category).toBeUndefined()
    expect(post?.status).toBe('published')
  })

  it('title이 없으면 실패로 표시한다', () => {
    const raw = `---
date: "2024-01-01"
---
Body`
    const { post, error } = parseFrontmatter('bad.mdx', raw)
    expect(post).toBeNull()
    expect(error).toMatch(/title/)
  })

  it('date가 파싱 불가능하면 실패로 표시한다', () => {
    const raw = `---
title: "Bad Date"
date: "not-a-date"
---
Body`
    const { post, error } = parseFrontmatter('bad-date.mdx', raw)
    expect(post).toBeNull()
    expect(error).toMatch(/date/)
  })
})
