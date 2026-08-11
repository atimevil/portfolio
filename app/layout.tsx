import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'
import 'leaflet/dist/leaflet.css'
import { getSettings } from '@/lib/settings'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'

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
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
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
