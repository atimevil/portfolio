import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '포트폴리오',
  description: '개발자 포트폴리오',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
