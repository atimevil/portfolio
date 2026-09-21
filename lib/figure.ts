import fs from 'fs'
import path from 'path'

const DIR = path.join(process.cwd(), 'public/figures')

/**
 * 다이어그램 SVG를 읽어 페이지에 인라인할 소스를 돌려준다.
 *
 * <img>로 부르면 SVG가 문서의 .dark 클래스를 못 보고 OS 설정만 따라가서, 기본이
 * 다크인 이 사이트에서는 OS가 라이트인 방문자에게 반대 테마로 뜬다. 인라인해야
 * globals.css의 .fig 값이 상속되고, SVG 안의 aria-label도 스크린리더에 노출된다.
 *
 * thumbnail은 관리자 화면에서 들어오는 문자열이라 경로를 신뢰하지 않는다.
 * /figures/<이름>.svg 형태만 받고, 그 외(업로드한 PNG 등)는 null을 돌려
 * 호출부가 <img>로 처리하게 둔다.
 */
export function readFigure(src: string | undefined): string | null {
  if (!src) return null
  const name = /^\/figures\/([a-z0-9-]+)\.svg$/.exec(src)?.[1]
  if (!name) return null
  const file = path.join(DIR, `${name}.svg`)
  // 이름에 . 이나 / 가 못 들어가므로 이미 막혀 있지만, DIR 밖이면 한 번 더 거른다.
  if (!file.startsWith(DIR + path.sep)) return null
  try {
    return scopeFigure(fs.readFileSync(file, 'utf-8'), `fig-${name}`)
  } catch {
    return null
  }
}

/**
 * 인라인 SVG의 id와 <style>을 그림 하나 범위로 가둔다.
 *
 * 인라인하면 SVG 안의 <style>은 문서 전역 규칙이 되고 id도 문서 전체에서 하나여야
 * 한다. 그림마다 .t·.box 같은 같은 클래스명을 다른 값으로 쓰고 화살표 마커를
 * 전부 id="a"로 두었기 때문에, 홈 카드처럼 한 페이지에 여러 장이 올라가면 나중
 * 그림의 규칙과 첫 그림의 마커가 전부를 덮는다.
 */
export function scopeFigure(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`)
    .replace(/<svg\b/, `<svg id="${prefix}"`)
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, css: string) => {
      const scoped = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/([^{}]+)\{/g, (_m, sel: string) =>
          `\n${sel.split(',').map((s) => `#${prefix} ${s.trim()}`).join(', ')} {`,
        )
      return `<style>${scoped}</style>`
    })
}
