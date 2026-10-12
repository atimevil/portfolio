import { getServerSession } from 'next-auth'
import { getSettings } from '@/lib/settings'

type NavKey = 'books' | 'music' | 'gallery'

// 공개 GET API용 게이트. 화면에서 숨긴 것을 API로는 볼 수 있으면 숨긴 의미가 없다.
// 로그인한 관리자는 항상 통과한다. 비로그인은 개발중 모드이거나, 해당 메뉴를 꺼 두었으면 막는다.
export async function hiddenFromPublic(nav?: NavKey): Promise<boolean> {
  const { devMode, navVisibility } = getSettings()
  if (!devMode && (!nav || navVisibility[nav])) return false
  return !(await getServerSession())
}
