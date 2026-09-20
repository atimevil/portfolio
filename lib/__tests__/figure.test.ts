import { describe, it, expect } from 'vitest'
import { readFigure } from '@/lib/figure'

describe('readFigure', () => {
  it('실제 다이어그램을 읽는다', () => {
    const svg = readFigure('/figures/ctf-solver-mcp.svg')
    expect(svg).toContain('<svg')
    expect(svg).toContain('aria-label')
  })

  it('테마 토큰을 직접 정의하지 않고 참조만 한다', () => {
    // :root 정의가 남아 있으면 인라인될 때 페이지 토큰을 덮어쓴다.
    const svg = readFigure('/figures/finbert-ssl-distribution.svg')!
    expect(svg).not.toMatch(/:root\s*\{/)
    expect(svg).not.toContain('prefers-color-scheme')
    expect(svg).toContain('var(--ink)')
  })

  it('없는 그림은 null', () => {
    expect(readFigure('/figures/nope.svg')).toBeNull()
  })

  it('figures 밖의 경로는 거부한다', () => {
    for (const bad of [
      '/figures/../../package.json',
      '/figures/../items.json',
      '../../../etc/passwd',
      '/uploads/shot.svg',
      '/figures/a.svg/../../../etc/passwd',
    ]) {
      expect(readFigure(bad)).toBeNull()
    }
  })

  it('SVG가 아닌 썸네일은 null — 호출부가 <img>로 처리한다', () => {
    expect(readFigure('/uploads/cover.png')).toBeNull()
    expect(readFigure(undefined)).toBeNull()
    expect(readFigure('')).toBeNull()
  })
})
