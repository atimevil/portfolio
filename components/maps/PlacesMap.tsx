'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Place } from '@prisma/client'

interface Props {
  places: Place[]
  selected: Place | null
  onSelect: (p: Place | null) => void
  /** 등록 폼에서 방금 고른 위치 (아직 저장 전) */
  draft: { lat: number; lng: number } | null
}

// 종류별 핀 색 — 맛집은 사이트 accent 보라, 쇼핑은 대비되는 청록, 임시 후보는 주황.
const PIN_COLORS = {
  food: { base: '#9d8cd8', active: '#b7a8ea' },
  shopping: { base: '#67c9c4', active: '#8fdcd8' },
  draft: '#f5a97f',
} as const

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #131317;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  })
}

function pinColor(type: string, isActive: boolean) {
  const set = type === 'shopping' ? PIN_COLORS.shopping : PIN_COLORS.food
  return isActive ? set.active : set.base
}

// 선택된 장소가 바뀌면 지도를 그 위치로 부드럽게 이동시킨다.
function PanTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15))
  }, [map, target])
  return null
}

// 지도의 빈 곳을 클릭하면 선택을 해제한다.
function DeselectOnMapClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

const SEOUL = { lat: 37.5665, lng: 126.978 }

export default function PlacesMap({ places, selected, onSelect, draft }: Props) {
  // 필터로 핀이 사라진 곳의 정보창이 공중에 남지 않도록,
  // 현재 표시 중인 목록에 있는 경우에만 정보창을 띄운다.
  const activeSelected = selected && places.some((p) => p.id === selected.id) ? selected : null

  const initialCenter = places[0] ? { lat: places[0].lat, lng: places[0].lng } : SEOUL

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={places.length > 0 ? 13 : 11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DeselectOnMapClick onClick={() => onSelect(null)} />

        <PanTo
          target={
            draft ?? (activeSelected ? { lat: activeSelected.lat, lng: activeSelected.lng } : null)
          }
        />

        {places.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={pinIcon(pinColor(p.type, selected?.id === p.id))}
            eventHandlers={{
              click: () => onSelect(p),
              popupclose: () => {
                if (selected?.id === p.id) onSelect(null)
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="max-w-[200px] text-xs text-neutral-900">
                <p className="font-semibold">{p.name}</p>
                {p.memo && <p className="mt-0.5 text-neutral-600">{p.memo}</p>}
              </div>
            </Tooltip>

            {activeSelected?.id === p.id && (
              <Popup>
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
              </Popup>
            )}
          </Marker>
        ))}

        {/* 아직 저장하지 않은 후보 위치는 주황으로 구분 */}
        {draft && <Marker position={[draft.lat, draft.lng]} icon={pinIcon(PIN_COLORS.draft)} />}
      </MapContainer>
    </div>
  )
}
