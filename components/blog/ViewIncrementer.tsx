'use client'

import { useEffect } from 'react'

export default function ViewIncrementer({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])
  return null
}
