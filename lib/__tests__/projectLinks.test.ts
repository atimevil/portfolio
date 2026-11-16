import { describe, it, expect } from 'vitest'
import { projectLinks } from '@/lib/projectLinks'
import type { PortfolioItem } from '@/types'

const base = { id: 'p1', type: 'project', year: '2026', title: 't' } as PortfolioItem

describe('projectLinks', () => {
  it('회고 글 슬러그가 있으면 사이트 안 링크를 맨 앞에 둔다', () => {
    const links = projectLinks({ ...base, post: 'ai-pilot-top-gun-retrospective', github: 'https://github.com/x/y' }, 'ko')
    expect(links[0]).toEqual({ label: '회고 글', href: '/blog/ai-pilot-top-gun-retrospective', internal: true })
    expect(links[1].label).toBe('GitHub')
  })

  it('슬러그가 비었거나 공백이면 링크를 만들지 않는다', () => {
    expect(projectLinks({ ...base, post: '   ' }, 'ko')).toEqual([])
    expect(projectLinks(base, 'ko')).toEqual([])
  })

  it('경로에 쓰면 안 되는 글자는 인코딩된다', () => {
    const [l] = projectLinks({ ...base, post: 'a b/c' }, 'ko')
    expect(l.href).toBe('/blog/a%20b%2Fc')
  })
})
