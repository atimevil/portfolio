'use client'

import { useState } from 'react'

type Scan = { count: number; bytes: number; files: string[] }

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

// 안 쓰는 사진 정리 — 등록을 취소했거나, 사진을 교체했거나, 장소를 지운 뒤
// 서버에 남은 파일을 찾아서 지운다. 항상 '먼저 보여주고 → 확인 후 삭제'한다.
export default function PhotoCleanup() {
  const [scan, setScan] = useState<Scan | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function check() {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const res = await fetch('/api/places/cleanup')
      if (!res.ok) {
        setError('확인에 실패했습니다.')
        return
      }
      setScan(await res.json())
    } catch {
      setError('확인에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function purge() {
    if (!scan || scan.count === 0) return
    if (!confirm(`안 쓰는 사진 ${scan.count}장을 삭제할까요? 되돌릴 수 없습니다.`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/places/cleanup', { method: 'DELETE' })
      if (!res.ok) {
        setError('삭제에 실패했습니다.')
        return
      }
      const result = await res.json()
      setDone(`${result.deleted}장 삭제 (${formatBytes(result.bytes)} 확보)`)
      setScan(null)
    } catch {
      setError('삭제에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">안 쓰는 사진 정리</p>
          <p className="mt-0.5 text-xs text-text-muted">
            등록을 취소했거나 교체·삭제해서 아무 곳에도 안 붙은 사진을 찾아 지웁니다.
          </p>
        </div>
        <button
          onClick={check}
          disabled={busy}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
        >
          {busy && !scan ? '확인 중…' : '확인'}
        </button>
      </div>

      {scan && (
        <div className="mt-3 border-t border-border pt-3">
          {scan.count === 0 ? (
            <p className="text-xs text-text-muted">안 쓰는 사진이 없습니다. 깨끗해요.</p>
          ) : (
            <>
              <p className="text-xs text-text-secondary">
                안 쓰는 사진 <span className="font-semibold text-accent">{scan.count}장</span> ·{' '}
                {formatBytes(scan.bytes)}
              </p>
              <ul className="mt-1.5 max-h-24 overflow-y-auto text-[11px] text-text-muted">
                {scan.files.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                onClick={purge}
                disabled={busy}
                className="mt-2.5 rounded-md border border-red-400 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
              >
                {busy ? '삭제 중…' : `${scan.count}장 삭제`}
              </button>
            </>
          )}
        </div>
      )}

      {done && <p className="mt-2 text-xs text-accent">{done}</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  )
}
