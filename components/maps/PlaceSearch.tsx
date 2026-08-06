'use client'

import { useEffect, useState } from 'react'

export type PickedPlace = {
  name: string
  lat: number
  lng: number
  address: string
  placeId: string
}

interface Props {
  onPick: (place: PickedPlace) => void
  placeholder?: string
}

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  namedetails?: { name?: string }
  name?: string
}

// OpenStreetMap Nominatim으로 가게명을 검색한다. API 키가 필요 없는 대신
// 사용 정책(초당 1회, User-Agent 필수)을 지켜야 한다. 이름은 지도에 등록된
// 현지 표기(한글 상호는 한글로, 일본 상호는 일본어/영문으로)로만 검색된다.
export default function PlaceSearch({ onPick, placeholder }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const query = input.trim()
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    // 타이핑이 멈춘 뒤에만 호출 (요청 억제 + Nominatim 정책 준수).
    // cancelled 플래그: 타이머를 지워도 이미 나간 요청은 못 막으므로, 늦게 도착한
    // 옛 응답이 최신 결과를 덮어쓰지 않도록 막는다.
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&namedetails=1&addressdetails=0&limit=6&q=${encodeURIComponent(query)}`
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
        })
        if (cancelled) return
        if (!res.ok) throw new Error('search failed')
        const data: NominatimResult[] = await res.json()
        if (cancelled) return
        setSuggestions(data)
      } catch {
        if (cancelled) return
        setError('검색에 실패했습니다. 잠시 후 다시 시도해주세요.')
        setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [input])

  function handlePick(s: NominatimResult) {
    const name = s.namedetails?.name || s.name || s.display_name.split(',')[0]
    onPick({
      name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
      address: s.display_name,
      placeId: String(s.place_id),
    })
    setInput('')
    setSuggestions([])
  }

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder ?? '가게명 검색'}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-text-muted">검색 중…</span>}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-secondary shadow-lg">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="block w-full px-3 py-2 text-left transition-colors hover:bg-surface"
              >
                <span className="block text-sm text-text-primary">
                  {s.namedetails?.name || s.name || s.display_name.split(',')[0]}
                </span>
                <span className="block text-xs text-text-muted">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
