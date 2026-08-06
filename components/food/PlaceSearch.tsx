'use client'

import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

export type PickedPlace = {
  name: string
  lat: number
  lng: number
  address: string
  placeId: string
}

interface Props {
  onPick: (place: PickedPlace) => void
}

type Suggestion = {
  text: string
  secondary: string
  /** google.maps.places.PlacePrediction */
  prediction: {
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<unknown>
      id?: string
      displayName?: string | null
      formattedAddress?: string | null
      location?: { lat: () => number; lng: () => number } | null
    }
  }
}

// 가게명으로 구글 장소를 검색한다.
// 비용: 세션 토큰을 쓰면 "입력 중 자동완성 호출"은 과금되지 않고, 사용자가 하나를
// 선택해 fetchFields()를 호출하는 시점에 세션 하나로 정산된다. 그래서 토큰은
// 검색 시작 시 만들고 선택 직후 버린다.
export default function PlaceSearch({ onPick }: Props) {
  const placesLib = useMapsLibrary('places')
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionToken = useRef<unknown>(null)

  useEffect(() => {
    if (!placesLib) return
    const query = input.trim()
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    // 타이핑이 멈춘 뒤에만 호출 (불필요한 요청 억제).
    // cancelled 플래그가 필요한 이유: 타이머를 지워도 '이미 출발한' 요청은 못 막는다.
    // 빠르게 타이핑하면 늦게 도착한 옛 응답이 최신 결과를 덮어쓰는 문제가 생긴다.
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const places = placesLib as unknown as {
          AutocompleteSessionToken: new () => unknown
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (req: unknown) => Promise<{ suggestions: unknown[] }>
          }
        }
        if (!sessionToken.current) sessionToken.current = new places.AutocompleteSessionToken()

        const { suggestions: raw } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionToken.current,
        })
        if (cancelled) return

        setSuggestions(
          raw
            .map((s) => {
              const pred = (s as { placePrediction?: unknown }).placePrediction
              if (!pred) return null
              const p = pred as {
                mainText?: { text: string }
                secondaryText?: { text: string }
              }
              return {
                text: p.mainText?.text ?? '',
                secondary: p.secondaryText?.text ?? '',
                prediction: pred as Suggestion['prediction'],
              }
            })
            .filter((s): s is Suggestion => s !== null)
        )
      } catch {
        if (cancelled) return
        setError('검색에 실패했습니다. 잠시 후 다시 시도해주세요.')
        setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [input, placesLib])

  async function handlePick(s: Suggestion) {
    try {
      setLoading(true)
      const place = s.prediction.toPlace()
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] })
      const loc = place.location
      if (!loc) {
        setError('이 장소의 좌표를 가져오지 못했습니다.')
        return
      }
      onPick({
        name: place.displayName ?? s.text,
        lat: loc.lat(),
        lng: loc.lng(),
        address: place.formattedAddress ?? '',
        placeId: place.id ?? '',
      })
      setInput('')
      setSuggestions([])
      sessionToken.current = null // 세션 종료 — 다음 검색은 새 세션
    } catch {
      setError('장소 정보를 가져오지 못했습니다.')
      // 실패해도 세션은 끝난 것으로 보고 버린다. 재사용하면 과금 세션이 꼬인다.
      sessionToken.current = null
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placesLib ? '가게명 검색 (예: 스시로 시부야점)' : '지도 로딩 중…'}
        disabled={!placesLib}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none disabled:opacity-50"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-text-muted">검색 중…</span>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-secondary shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="block w-full px-3 py-2 text-left transition-colors hover:bg-surface"
              >
                <span className="block text-sm text-text-primary">{s.text}</span>
                {s.secondary && (
                  <span className="block text-xs text-text-muted">{s.secondary}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
