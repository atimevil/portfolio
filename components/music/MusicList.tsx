'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Track } from '@prisma/client'

interface Props {
  tracks: Track[]
}

type SortKey = 'title' | 'artist' | 'genre'
type SortDir = 'asc' | 'desc'

const FILTER_STORAGE_KEY = 'music-filter-genre'

function getGenres(tracks: Track[]): string[] {
  const set = new Set(tracks.map((t) => t.genre || '기타'))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
}

function sortTracks(tracks: Track[], key: SortKey | null, dir: SortDir): Track[] {
  if (!key) return tracks
  const value = (t: Track) => (key === 'genre' ? t.genre || '기타' : t[key])
  const sorted = [...tracks].sort((a, b) => value(a).localeCompare(value(b), 'ko'))
  return dir === 'asc' ? sorted : sorted.reverse()
}

export default function MusicList({ tracks }: Props) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const genres = useMemo(() => getGenres(tracks), [tracks])

  // 저장된 필터를 마운트 후 복원 (SSR과 불일치 안 나게 useEffect에서). 데이터에 더 없는 장르면 무시.
  useEffect(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY)
    if (saved && genres.includes(saved)) setSelectedGenre(saved)
  }, [genres])

  function selectGenre(genre: string | null) {
    setSelectedGenre(genre)
    if (genre) localStorage.setItem(FILTER_STORAGE_KEY, genre)
    else localStorage.removeItem(FILTER_STORAGE_KEY)
  }

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    }
  }

  const filtered = useMemo(
    () => (selectedGenre ? tracks.filter((t) => (t.genre || '기타') === selectedGenre) : tracks),
    [tracks, selectedGenre]
  )
  const visible = useMemo(() => sortTracks(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const active = sortKey === sortKeyName
    return (
      <button
        onClick={() => toggleSort(sortKeyName)}
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
          active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {label}
        {active && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    )
  }

  if (tracks.length === 0) {
    return <p className="text-center text-text-secondary py-10 text-sm">아직 없습니다.</p>
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => selectGenre(null)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            selectedGenre === null
              ? 'border-accent text-accent'
              : 'border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          전체
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => selectGenre(genre)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedGenre === genre
                ? 'border-accent text-accent'
                : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-text-secondary py-10 text-sm">해당 장르에 곡이 없습니다.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-12 px-3 py-2"></th>
                <th className="text-left px-3 py-2">
                  <SortHeader label="제목" sortKeyName="title" />
                </th>
                <th className="text-left px-3 py-2">
                  <SortHeader label="가수" sortKeyName="artist" />
                </th>
                <th className="text-left px-3 py-2">
                  <SortHeader label="장르" sortKeyName="genre" />
                </th>
                <th className="w-12 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((track) => (
                <tr
                  key={track.id}
                  onClick={() => {
                    if (track.link) window.open(track.link, '_blank', 'noopener,noreferrer')
                  }}
                  className={track.link ? 'cursor-pointer hover:bg-bg-secondary transition-colors' : ''}
                >
                  <td className="px-3 py-2">
                    {track.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.cover} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-surface" />
                    )}
                  </td>
                  <td className="relative group px-3 py-2 max-w-[200px]">
                    <span className="block truncate text-text-primary font-medium">{track.title}</span>
                    {track.memo && (
                      <div className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs whitespace-normal rounded-md border border-border bg-bg-secondary px-3 py-2 text-xs font-normal text-text-secondary shadow-lg">
                        {track.memo}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary truncate max-w-[160px]">{track.artist}</td>
                  <td className="px-3 py-2 text-text-secondary">{track.genre || '기타'}</td>
                  <td className="px-3 py-2 text-text-secondary">{track.link ? '↗' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
