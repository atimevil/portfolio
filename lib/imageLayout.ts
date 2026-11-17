// 글 안 이미지 배치 값. 에디터(저장)·정제(공개 렌더)·CSS가 같은 값만 쓴다.
// 크기는 글 폭에 대한 % — 10% 단위로만 저장해서 CSS 선택자로 그릴 수 있게 한다(style 속성은 정제에서 막혀 있다).

/** 저장 가능한 너비(%). 100%(글 폭)는 값 없이 둔다. */
export const IMAGE_WIDTHS = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const

/** 글 옆에 붙이는 위치. 없으면 가운데(글은 위아래로). */
export const IMAGE_ALIGNS = ['left', 'right'] as const

export type ImageAlign = (typeof IMAGE_ALIGNS)[number]

/** 아무 숫자(%)를 저장 가능한 너비로 바꾼다. 100%에 가까우면 null(글 폭). */
export function snapImageWidth(percent: number): number | null {
  if (!Number.isFinite(percent)) return null
  const snapped = Math.round(percent / 10) * 10
  if (snapped >= 100) return null
  return Math.min(90, Math.max(10, snapped))
}

export function isImageWidth(v: unknown): boolean {
  return IMAGE_WIDTHS.some((w) => String(w) === String(v))
}

export function isImageAlign(v: unknown): v is ImageAlign {
  return IMAGE_ALIGNS.some((a) => a === v)
}
