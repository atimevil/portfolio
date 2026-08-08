'use client'

import { useMemo } from 'react'
import type { Track } from '@prisma/client'

interface Props {
  tracks: Track[]
}

function groupByGenre(tracks: Track[]): [string, Track[]][] {
  const groups = new Map<string, Track[]>()
  for (const track of tracks) {
    const key = track.genre || '기타'
    const list = groups.get(key) ?? []
    list.push(track)
    groups.set(key, list)
  }
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ko'))
}

export default function MusicList({ tracks }: Props) {
  const grouped = useMemo(() => groupByGenre(tracks), [tracks])

  if (grouped.length === 0) {
    return <p className="text-center text-text-secondary py-10 text-sm">아직 없습니다.</p>
  }

  return (
    <div>
      {grouped.map(([genre, list]) => (
        <div key={genre} className="mb-8">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            {genre}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((track) => (
              <a
                key={track.id}
                href={track.link ?? undefined}
                target={track.link ? '_blank' : undefined}
                rel={track.link ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-3 border border-border rounded-lg p-3 bg-bg-secondary ${
                  track.link ? 'hover:border-accent transition-colors' : ''
                }`}
              >
                {track.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.cover} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-surface shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{track.title}</p>
                  <p className="text-sm text-text-secondary truncate">{track.artist}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
