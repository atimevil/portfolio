export const dynamic = 'force-dynamic'

import AboutContent from '@/components/about/AboutContent'
import { buildPageMetadata } from '@/lib/site'

export function generateMetadata() {
  return buildPageMetadata({
    path: '/en/about',
    title: 'About',
    description: 'Projects, awards and activity',
    languages: { ko: '/about', en: '/en/about' },
  })
}

export default async function EnAboutPage() {
  return <AboutContent locale="en" />
}
