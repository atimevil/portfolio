'use client'

import { useId } from 'react'
import { canonicalGenre } from '@/lib/adminList'

interface Props {
  value: string
  onChange: (v: string) => void
  genres: string[] // 많이 쓴 순서 (genreCounts 결과)
  id?: string
}

const CHIP_LIMIT = 8

// 칩은 DB에 실제로 있는 장르 — 예전 한글 프리셋('팝')이 DB의 'Pop'과 갈라졌던 일을 막는다.
// 직접 입력은 기존 장르를 자동완성으로 권하고, 대소문자만 다르면 어떤 값으로 저장될지 미리 보여준다.
export default function GenreInput({ value, onChange, genres, id }: Props) {
  const listId = useId()
  const canonical = canonicalGenre(value, genres)
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {genres.slice(0, CHIP_LIMIT).map((g) => (
          <button
            type="button"
            key={g}
            onClick={() => onChange(value === g ? '' : g)}
            aria-pressed={value === g}
            className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
              value === g ? 'border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        placeholder="장르 (비우면 장르 없음)"
        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-bg"
      />
      <datalist id={listId}>
        {genres.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      {canonical && canonical !== value.trim() && (
        <p className="text-xs text-text-muted">‘{canonical}’(으)로 저장됩니다</p>
      )}
    </div>
  )
}
