'use client'

/** 저절로 5초 넘게 움직이는 화면에는 멈출 방법이 있어야 한다(WCAG 2.2.2). */
export default function ClipPauseButton({
  paused,
  onToggle,
  labels,
  className = '',
}: {
  paused: boolean
  onToggle: () => void
  labels: { pause: string; play: string }
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-bg-translucent px-3 text-xs font-medium text-text-primary backdrop-blur transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {paused ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
      )}
      {paused ? labels.play : labels.pause}
    </button>
  )
}
