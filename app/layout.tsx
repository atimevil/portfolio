import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import 'katex/dist/katex.min.css'
import 'leaflet/dist/leaflet.css'
import { getSettings } from '@/lib/settings'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'
import { IBM_Plex_Mono } from 'next/font/google'

// 수치·날짜는 Plex Mono — 라틴 글자뿐이라 빌드 때 받아 자체 호스팅한다.
// 본문 IBM Plex Sans KR은 아래 <link>로 Google Fonts에서 직접 받는다. 한글 글꼴은
// next/font로 받으면 전 글자를 빌드 때 내려받다 시간 초과로 대체 글꼴로 조용히 넘어간다.
// 브라우저가 받으면 페이지에 쓰인 글자 조각(unicode-range)만 내려받는다.
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-mono', display: 'swap' })
const SANS_CSS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap'

export function generateMetadata(): Metadata {
  const { profile } = getSettings()
  const name = profile.name?.trim() || '포트폴리오'
  const description = profile.bio?.trim() || profile.aboutText?.trim() || '개발자 포트폴리오'

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: name,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      locale: 'ko_KR',
      title: name,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
    icons: { icon: '/icon.svg' },
    alternates: {
      types: { 'application/rss+xml': '/rss.xml' },
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 미들웨어가 /en 요청에만 x-locale을 붙인다. 나머지는 기본값 ko.
  const locale = headers().get('x-locale') === 'en' ? 'en' : 'ko'

  return (
    <html lang={locale} className={mono.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={SANS_CSS} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme')
                if (theme === 'light') {
                  // 명시적으로 라이트를 선택한 경우만 라이트
                } else {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {
                document.documentElement.classList.add('dark')
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
