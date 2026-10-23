'use client'

import { useId, useRef } from 'react'
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
  // 브라우저는 자동완성 목록이 열려 있는지 알려 주지 않는다. 입력·↓·클릭으로 열렸을 수 있다고 보고,
  // 그동안의 첫 Esc는 목록만 닫게 한다(패널의 'Esc로 닫기'까지 번져 저장 안 한 수정 확인창이 뜨지 않게).
  const listMaybeOpen = useRef(false)
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
        onChange={(e) => {
          // 목록에서 항목을 골라 값이 바뀐 경우(insertReplacementText)는 목록이 이미 닫혔다
          listMaybeOpen.current = (e.nativeEvent as InputEvent).inputType !== 'insertReplacementText'
          onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') listMaybeOpen.current = true
          else if (e.key === 'Escape' && listMaybeOpen.current) {
            listMaybeOpen.current = false
            e.stopPropagation()
          }
        }}
        onClick={() => { listMaybeOpen.current = true }}
        onBlur={() => { listMaybeOpen.current = false }}
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
