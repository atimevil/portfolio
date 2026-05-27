'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push(`/${locale}/admin`)
    } else {
      setError('비밀번호가 틀렸습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Admin</p>
          <h1 className="text-xl font-semibold text-text-primary">로그인</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border rounded-lg p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs text-text-muted mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              placeholder="비밀번호 입력"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
