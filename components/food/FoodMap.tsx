'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import type { Restaurant } from '@prisma/client'

interface Props {
  restaurants: Restaurant[]
  selected: Restaurant | null
  onSelect: (r: Restaurant | null) => void
  /** 등록 폼에서 방금 고른 위치 (아직 저장 전) */
  draft: { lat: number; lng: number; name: string } | null
  /** 구글 클라우드에서 발급한 Map ID. AdvancedMarker가 동작하려면 실제 ID여야 한다. */
  mapId: string
}

// 선택된 맛집이 바뀌면 지도를 그 위치로 부드럽게 이동시킨다.
function PanTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !target) return
    map.panTo(target)
    if ((map.getZoom() ?? 0) < 14) map.setZoom(15)
  }, [map, target])
  return null
}

const SEOUL = { lat: 37.5665, lng: 126.978 }

export default function FoodMap({ restaurants, selected, onSelect, draft, mapId }: Props) {
  // 지도 최초 중심: 등록된 맛집이 있으면 첫 번째, 없으면 서울
  const initialCenter = restaurants[0]
    ? { lat: restaurants[0].lat, lng: restaurants[0].lng }
    : SEOUL

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border">
      <Map
        defaultCenter={initialCenter}
        defaultZoom={restaurants.length > 0 ? 13 : 11}
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={() => onSelect(null)}
      >
        <PanTo target={draft ?? (selected ? { lat: selected.lat, lng: selected.lng } : null)} />

        {restaurants.map((r) => (
          <AdvancedMarker
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            onClick={() => onSelect(r)}
          >
            <Pin
              background={selected?.id === r.id ? '#b7a8ea' : '#9d8cd8'}
              borderColor="#131317"
              glyphColor="#131317"
            />
          </AdvancedMarker>
        ))}

        {/* 아직 저장하지 않은 후보 위치는 다른 색으로 구분 */}
        {draft && (
          <AdvancedMarker position={{ lat: draft.lat, lng: draft.lng }}>
            <Pin background="#f5a97f" borderColor="#131317" glyphColor="#131317" />
          </AdvancedMarker>
        )}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => onSelect(null)}
          >
            <div className="min-w-[160px] text-neutral-900">
              <p className="text-sm font-bold">{selected.name}</p>
              {selected.category && (
                <p className="mt-0.5 text-xs text-violet-700">{selected.category}</p>
              )}
              {selected.menus && <p className="mt-1 text-xs">🍽 {selected.menus}</p>}
              {selected.memo && <p className="mt-1 text-xs text-neutral-600">{selected.memo}</p>}
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  )
}
