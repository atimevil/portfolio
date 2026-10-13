import { describe, it, expect, beforeEach } from 'vitest'
import { getAllTracks, createTrack, updateTrack, deleteTrack, updateTracks, deleteTracks } from '@/lib/music'
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

describe('favorite', () => {
  it('기본은 즐겨찾기가 아니고, 수정으로 켜고 끌 수 있다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    expect(track.favorite).toBe(false)
    expect((await updateTrack(track.id, { favorite: true })).favorite).toBe(true)
    expect((await updateTrack(track.id, { favorite: false })).favorite).toBe(false)
  })
})

describe('deleteTrack', () => {
  it('삭제 후에는 목록에서 사라진다', async () => {
    const track = await createTrack({ title: 'T', artist: 'A' })
    await deleteTrack(track.id)
    expect(await getAllTracks()).toHaveLength(0)
  })
})

describe('장르 대소문자 맞추기', () => {
  it('기존 장르와 대소문자만 다르면 기존 값으로 저장한다', async () => {
    await createTrack({ title: 'A', artist: 'x', genre: 'Pop' })
    const t = await createTrack({ title: 'B', artist: 'y', genre: ' pop ' })
    expect(t.genre).toBe('Pop')
    const u = await updateTrack(t.id, { genre: 'POP' })
    expect(u.genre).toBe('Pop')
  })

  it('처음 보는 장르는 앞뒤 공백만 지우고 그대로 저장한다', async () => {
    const t = await createTrack({ title: 'A', artist: 'x', genre: '  City Pop ' })
    expect(t.genre).toBe('City Pop')
  })
})

describe('updateTracks / deleteTracks', () => {
  it('여러 곡의 장르를 한 번에 바꾸고 처리 수를 돌려준다', async () => {
    await createTrack({ title: 'old', artist: 'x', genre: 'Hip Hop' })
    const a = await createTrack({ title: 'A', artist: 'x' })
    const b = await createTrack({ title: 'B', artist: 'y' })
    const count = await updateTracks([a.id, b.id], { genre: 'hip hop' })
    expect(count).toBe(2)
    const all = await getAllTracks()
    expect(all.filter((t) => t.genre === 'Hip Hop')).toHaveLength(3)
  })

  it('빈 장르는 null(장르 없음)로 되돌린다', async () => {
    const a = await createTrack({ title: 'A', artist: 'x', genre: 'Pop' })
    await updateTracks([a.id], { genre: '  ' })
    expect((await getAllTracks())[0].genre).toBeNull()
  })

  it('즐겨찾기를 한 번에 켠다', async () => {
    const a = await createTrack({ title: 'A', artist: 'x' })
    const b = await createTrack({ title: 'B', artist: 'y' })
    expect(await updateTracks([a.id, b.id], { favorite: true })).toBe(2)
    expect((await getAllTracks()).every((t) => t.favorite)).toBe(true)
  })

  it('없는 id가 섞여도 실제로 처리한 수만 돌려준다', async () => {
    const a = await createTrack({ title: 'A', artist: 'x' })
    expect(await updateTracks([a.id, 999999], { favorite: true })).toBe(1)
    expect(await deleteTracks([a.id, 999999])).toBe(1)
    expect(await getAllTracks()).toHaveLength(0)
  })
})
