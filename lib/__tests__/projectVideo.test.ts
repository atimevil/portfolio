import { describe, it, expect } from 'vitest'
import { parseVideo, formatClock } from '@/lib/projectVideo'

describe('parseVideo', () => {
  it('비어 있으면 null', () => {
    expect(parseVideo(undefined)).toBeNull()
    expect(parseVideo('  ')).toBeNull()
  })

  it.each([
    'https://www.youtube.com/watch?v=86x1i86nqeE',
    'https://youtu.be/86x1i86nqeE',
    'https://www.youtube.com/shorts/86x1i86nqeE',
    'https://www.youtube.com/embed/86x1i86nqeE',
    'https://www.youtube.com/watch?feature=share&v=86x1i86nqeE',
  ])('유튜브 주소 %s 를 nocookie 임베드로', (url) => {
    expect(parseVideo(url)).toMatchObject({
      kind: 'youtube',
      id: '86x1i86nqeE',
      embed: 'https://www.youtube-nocookie.com/embed/86x1i86nqeE?rel=0',
      clip: false,
    })
  })

  it('시작 시각을 살린다', () => {
    expect(parseVideo('https://youtu.be/86x1i86nqeE?t=90')).toMatchObject({ embed: expect.stringContaining('start=90') })
    expect(parseVideo('https://www.youtube.com/watch?v=86x1i86nqeE&t=1m30s')).toMatchObject({ embed: expect.stringContaining('start=90') })
  })

  it('끝 시각으로 한 장면만 자른다', () => {
    const v = parseVideo('https://www.youtube.com/watch?v=VKvAJJC_hAE&t=12895&end=12906')
    expect(v).toMatchObject({ embed: 'https://www.youtube-nocookie.com/embed/VKvAJJC_hAE?rel=0&start=12895&end=12906' })
    expect(parseVideo('https://youtu.be/VKvAJJC_hAE?start=3:34:55&end=3h35m6s')).toMatchObject({
      embed: expect.stringContaining('start=12895&end=12906'),
    })
    // 끝이 시작보다 앞이면 끝을 버린다
    expect(parseVideo('https://youtu.be/VKvAJJC_hAE?t=100&end=50')).toMatchObject({ embed: expect.not.stringContaining('end=') })
  })

  it('autoplay=1이면 구간을 소리 없이 되풀이하는 장면 모드', () => {
    const v = parseVideo('https://www.youtube.com/watch?v=VKvAJJC_hAE&t=12895&end=12906&autoplay=1')
    expect(v).toMatchObject({ kind: 'youtube', clip: true, start: 12895, end: 12906, watch: 'https://www.youtube.com/watch?v=VKvAJJC_hAE&t=12895s' })
    if (v?.kind !== 'youtube') throw new Error()
    const q = new URL(v.clipEmbed).searchParams
    expect(q.get('autoplay')).toBe('1')
    expect(q.get('mute')).toBe('1')
    expect(q.get('controls')).toBe('0')
    expect(q.get('enablejsapi')).toBe('1')
    expect(q.get('start')).toBe('12895')
    expect(q.get('end')).toBe('12906')
    expect(parseVideo('https://youtu.be/VKvAJJC_hAE?autoplay=0')).toMatchObject({ clip: false })
  })

  it('초를 시:분:초로', () => {
    expect(formatClock(12895)).toBe('3:34:55')
    expect(formatClock(95)).toBe('1:35')
    expect(formatClock(5)).toBe('0:05')
  })

  it('사이트 경로나 https의 mp4·webm은 파일로', () => {
    expect(parseVideo('/videos/dogfight.mp4')).toEqual({ kind: 'file', src: '/videos/dogfight.mp4' })
    expect(parseVideo('https://cdn.example.com/a.webm')).toEqual({ kind: 'file', src: 'https://cdn.example.com/a.webm' })
  })

  it('그 외는 거른다', () => {
    expect(parseVideo('javascript:alert(1)//.mp4')).toBeNull()
    expect(parseVideo('//evil.example/a.mp4')).toBeNull()
    expect(parseVideo('http://plain.example/a.mp4')).toBeNull()
    expect(parseVideo('https://vimeo.com/123')).toBeNull()
  })
})
