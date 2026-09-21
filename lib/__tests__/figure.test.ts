import { describe, it, expect } from 'vitest'
import fs from 'fs'
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

  describe('한 페이지에 여러 장 인라인해도 서로 간섭하지 않는다', () => {
    const names = fs.readdirSync('public/figures').filter((f) => f.endsWith('.svg'))
    const svgs = names.map((f) => readFigure(`/figures/${f}`)!)

    it('모든 CSS 규칙이 자기 그림 id로 시작한다', () => {
      svgs.forEach((svg, i) => {
        const root = `fig-${names[i].replace('.svg', '')}`
        const css = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? ''
        const selectors = Array.from(css.matchAll(/([^{}]+)\{/g)).flatMap((m) => m[1].split(',').map((s: string) => s.trim()))
        expect(selectors.length).toBeGreaterThan(0)
        for (const sel of selectors) expect(sel.startsWith(`#${root} `)).toBe(true)
      })
    })

    it('id가 페이지 전체에서 겹치지 않는다', () => {
      const ids = svgs.flatMap((svg) => Array.from(svg.matchAll(/\bid="([^"]+)"/g)).map((m) => m[1]))
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('마커 참조가 같은 그림 안의 id를 가리킨다', () => {
      for (const svg of svgs) {
        const ids = new Set(Array.from(svg.matchAll(/\bid="([^"]+)"/g)).map((m) => m[1]))
        for (const m of Array.from(svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g))) {
          expect(ids.has(m[1] ?? m[2])).toBe(true)
        }
      }
    })
  })
})
