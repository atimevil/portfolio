import { ImageResponse } from 'next/og'

export const alt = 'foxibu — Developer Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand/Latin-only card → renders reliably with the built-in font (no Hangul,
// so no external font fetch needed). Localized text lives in og:description.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 22,
            background: '#4f46e5',
            fontSize: 60,
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          f
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>foxibu</div>
        <div style={{ fontSize: 38, color: '#c7d2fe', marginTop: 12 }}>Developer Portfolio</div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginTop: 'auto' }}>foxibu.is-a.dev</div>
      </div>
    ),
    size,
  )
}
