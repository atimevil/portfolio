export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getRestaurants } from '@/lib/restaurants'
import FoodManager from '@/components/food/FoodManager'

export const metadata = {
  title: '맛집지도',
  robots: { index: false, follow: false },
}

// 비공개 개인 도구 — 로그인한 관리자만 접근 가능.
// middleware에서도 막지만, 라우트 자체에서 한 번 더 확인한다(방어적).
export default async function FoodPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login?callbackUrl=/food')

  const restaurants = await getRestaurants()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">맛집지도</h1>
        <p className="mt-1 text-sm text-text-secondary">
          가보고 싶은 곳 {restaurants.length}곳 · 나만 볼 수 있어요
        </p>
      </header>

      <FoodManager
        initial={restaurants}
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
      />
    </main>
  )
}
