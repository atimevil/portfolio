import { describe, it, expect, beforeEach } from 'vitest'
import { getAllTracks, createTrack, updateTrack, deleteTrack } from '@/lib/music'
import { resetDb } from './helpers/resetDb'

beforeEach(resetDb)

describe('createTrack + getAllTracks', () => {
  it('트랙을 저장하고 최신순으로 읽어온다', async () => {
    await createTrack({ title: '먼저 등록', artist: 'A' })
    await createTrack({ title: '나중 등록', artist: 'B' })

    const tracks = await getAllTracks()
    expect(tracks.map((t) => t.title)).toEqual(['나중 등록', '먼저 등록'])
  })

  it('빈 문자열 필드는 null로 저장된다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A', genre: '', cover: '', link: '' })
    expect(track.genre).toBeNull()
    expect(track.cover).toBeNull()
    expect(track.link).toBeNull()
  })
})

describe('updateTrack', () => {
  it('장르와 링크를 수정할 수 있다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    const updated = await updateTrack(track.id, { genre: '재즈', link: 'https://open.spotify.com/x' })
    expect(updated.genre).toBe('재즈')
    expect(updated.link).toBe('https://open.spotify.com/x')
  })
})

describe('deleteTrack', () => {
  it('삭제 후에는 목록에서 사라진다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    await deleteTrack(track.id)
    expect(await getAllTracks()).toHaveLength(0)
  })
})
