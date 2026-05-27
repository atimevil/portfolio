'use client'

import { useEffect, useState } from 'react'

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then((r) => r.json())
      .then((d) => setViews(d.views))
      .catch(() => {})
  }, [slug])

  if (views === null) return null
  return <span>{views.toLocaleString()} 조회</span>
}
