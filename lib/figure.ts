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
    return fs.readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}
