import tracks from './data-tracks.json'
import { prisma } from '../lib/prisma'
import { createTrack, type TrackInput } from '../lib/music'

// Notion Music List를 옮긴 일회성 임포트. 같은 제목+아티스트가 이미 있으면 건너뛰어 여러 번 돌려도 안전하다.
const key = (t: { title: string; artist: string }) => `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`

async function main() {
  const have = new Set((await prisma.track.findMany({ select: { title: true, artist: true } })).map(key))
  let added = 0
  for (const t of tracks as TrackInput[]) {
    if (have.has(key(t))) continue
    await createTrack(t)
    added++
  }
  console.log(`added ${added}, skipped ${tracks.length - added}`)
}

main().finally(() => prisma.$disconnect())
