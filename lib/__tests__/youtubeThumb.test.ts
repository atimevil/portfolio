import { describe, it, expect } from 'vitest'
import { smallYoutubeThumb } from '@/lib/youtubeThumb'

describe('smallYoutubeThumb', () => {
  it('유튜브 썸네일은 120×90 크기로 바꾼다', () => {
    expect(smallYoutubeThumb('https://img.youtube.com/vi/86x1i86nqeE/hqdefault.jpg')).toBe('https://img.youtube.com/vi/86x1i86nqeE/default.jpg')
    expect(smallYoutubeThumb('https://i.ytimg.com/vi/abc/maxresdefault.jpg')).toBe('https://i.ytimg.com/vi/abc/default.jpg')
  })

  it('직접 올린 커버는 그대로 둔다', () => {
    expect(smallYoutubeThumb('/uploads/music/music-1.jpg')).toBe('/uploads/music/music-1.jpg')
  })
})
