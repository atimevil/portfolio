'use client'

import { useEffect } from 'react'
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import type { Place } from '@prisma/client'

interface Props {
  places: Place[]
  selected: Place | null
  onSelect: (p: Place | null) => void
  /** 등록 폼에서 방금 고른 위치 (아직 저장 전) */
  draft: { lat: number; lng: number } | null
  /** 구글 클라우드에서 발급한 Map ID. AdvancedMarker가 동작하려면 실제 ID여야 한다. */
  mapId: string
}

// 종류별 핀 색 — 맛집은 사이트 accent 보라, 쇼핑은 대비되는 청록.
const PIN_COLORS = {
  food: { base: '#9d8cd8', active: '#b7a8ea' },
  shopping: { base: '#67c9c4', active: '#8fdcd8' },
} as const

function pinColor(type: string, isActive: boolean) {
  const set = type === 'shopping' ? PIN_COLORS.shopping : PIN_COLORS.food
  return isActive ? set.active : set.base
}

// 선택된 장소가 바뀌면 지도를 그 위치로 부드럽게 이동시킨다.
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

export default function FoodMap({ places, selected, onSelect, draft, mapId }: Props) {
  // 필터로 핀이 사라진 곳의 정보창이 공중에 남지 않도록,
  // 현재 표시 중인 목록에 있는 경우에만 정보창을 띄운다.
  const activeSelected = selected && places.some((p) => p.id === selected.id) ? selected : null

  const initialCenter = places[0] ? { lat: places[0].lat, lng: places[0].lng } : SEOUL

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border">
      <Map
        defaultCenter={initialCenter}
        defaultZoom={places.length > 0 ? 13 : 11}
        mapId={mapId}
        gestureHandling="greedy"
        onClick={() => onSelect(null)}
      >
        <PanTo
          target={
            draft ?? (activeSelected ? { lat: activeSelected.lat, lng: activeSelected.lng } : null)
          }
        />

        {places.map((p) => (
          <AdvancedMarker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => onSelect(p)}
          >
            <Pin
              background={pinColor(p.type, selected?.id === p.id)}
              borderColor="#131317"
              glyphColor="#131317"
            />
          </AdvancedMarker>
        ))}

        {/* 아직 저장하지 않은 후보 위치는 주황으로 구분 */}
        {draft && (
          <AdvancedMarker position={{ lat: draft.lat, lng: draft.lng }}>
            <Pin background="#f5a97f" borderColor="#131317" glyphColor="#131317" />
          </AdvancedMarker>
        )}

        {activeSelected && (
          <InfoWindow
            position={{ lat: activeSelected.lat, lng: activeSelected.lng }}
            onCloseClick={() => onSelect(null)}
          >
            <div className="min-w-[160px] max-w-[220px] text-neutral-900">
              {activeSelected.photo && (
                <img
                  src={activeSelected.photo}
                  alt=""
                  className="mb-1.5 h-24 w-full rounded object-cover"
                />
              )}
              <p className="text-sm font-bold">{activeSelected.name}</p>
              {activeSelected.category && (
                <p className="mt-0.5 text-xs text-violet-700">{activeSelected.category}</p>
              )}
              {activeSelected.items && (
                <p className="mt-1 text-xs">
                  {activeSelected.type === 'shopping' ? '🛍' : '🍽'} {activeSelected.items}
                </p>
              )}
              {activeSelected.memo && (
                <p className="mt-1 text-xs text-neutral-600">{activeSelected.memo}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  )
}
