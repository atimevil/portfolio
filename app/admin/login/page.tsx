'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 로그인 후 원래 가려던 곳으로 되돌아간다.
  // useSearchParams()는 이 페이지의 정적 생성을 깨뜨리므로(Suspense 요구), 값이 실제로
  // 필요한 제출 시점에 브라우저에서 직접 읽는다.
  // 외부 URL로 튕기지 않도록 내부 경로("/"로 시작, "//" 제외)만 허용한다.
  function resolveCallbackUrl() {
    const raw = new URLSearchParams(window.location.search).get('callbackUrl') ?? ''
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push(resolveCallbackUrl())
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
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="비밀번호 입력"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
