import { describe, expect, it } from 'vitest'
import { buildPageMetadata } from '@/lib/site'

const base = { title: 't', description: 'd' }

describe('buildPageMetadata og:locale', () => {
  it('한국어 경로는 ko_KR이고, 영문 짝이 있으면 en_US를 대체 로캘로 알린다', () => {
    const m = buildPageMetadata({ ...base, path: '/about', languages: { ko: 'a', en: 'b' } })
    expect(m.openGraph).toMatchObject({ locale: 'ko_KR', alternateLocale: ['en_US'] })
  })

  it('영문 경로는 en_US이고 ko_KR을 대체 로캘로 알린다', () => {
    for (const path of ['/en', '/en/about', '/en/work/not-yet']) {
      const m = buildPageMetadata({ ...base, path })
      expect(m.openGraph).toMatchObject({ locale: 'en_US', alternateLocale: ['ko_KR'] })
    }
  })

  it('/english 같은 경로는 영문으로 보지 않는다', () => {
    const m = buildPageMetadata({ ...base, path: '/english' })
    expect(m.openGraph).toMatchObject({ locale: 'ko_KR' })
  })
})
