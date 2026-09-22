import { ImageResponse } from 'next/og'

export const alt = 'foxibu — I learn by doing, more than by reading theory.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 이력서 링크를 메신저·링크드인에 붙이면 가장 먼저 보이는 카드다. 홈 첫 화면과 같은
// 말(이름 + 한 문장)을 쓰고, 색은 사이트 다크 팔레트(globals.css)에 맞춘다.
// 라틴 글자만 써서 내장 글꼴로 그린다(한글 글꼴을 따로 받지 않는다). 한국어 설명은 og:description에.
const BG = '#131317'
const INK = '#d6d4de'
const DIM = '#93919f'
const ACCENT = '#6a4dbd'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px 80px',
          background: BG,
          color: INK,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 14,
              background: ACCENT,
              color: '#ffffff',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            f
          </div>
          <div style={{ marginLeft: 20, fontSize: 36, fontWeight: 700 }}>foxibu</div>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.15, maxWidth: 980 }}>
          I learn by doing, more than by reading theory.
        </div>
        <div style={{ marginTop: 40, fontSize: 26, color: DIM }}>foxibu.is-a.dev</div>
      </div>
    ),
    size,
  )
}
