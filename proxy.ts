import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { buildCsp, makeNonce } from '@/lib/csp'

// Next 16에서 middleware.ts가 proxy.ts로 이름이 바뀌었다(동작은 같다). 관리자 인증과 /en 로케일 표시만 한다.
// devMode 차단은 content/settings.json을 읽어야 해서 app/(site)/layout.tsx에 있다.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 모든 페이지 요청에 nonce 기반 CSP를 건다. Next는 요청의 CSP 헤더에서 nonce를 읽어 자기 스크립트에 붙이고,
  // 루트 레이아웃은 x-nonce로 인라인 테마 스크립트에 붙인다.
  const nonce = makeNonce()
  const csp = buildCsp(nonce)
  const headers = new Headers(req.headers)
  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)
  const pass = () => {
    const res = NextResponse.next({ request: { headers } })
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  // 영문 페이지는 인증과 무관하다. 루트 레이아웃의 <html lang>이 읽을 로케일만 표시하고 통과시킨다.
  // (아래 인증 분기로 흘러가면 비로그인 방문자가 로그인 페이지로 튕긴다)
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    headers.set('x-locale', 'en')
    return pass()
  }

  // 로그인이 필요한 곳은 /admin 아래와 /maps뿐이다. 나머지 공개 페이지는 CSP만 붙여 통과시킨다.
  const protectedPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/maps'
  if (!protectedPath) return pass()

  const isLoginPage = pathname === '/admin/login'
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (isLoginPage) {
    // 이미 로그인했는데 로그인 페이지로 오면 대시보드로 보낸다
    if (token) return NextResponse.redirect(new URL('/admin', req.url))
  } else if (!token) {
    const loginUrl = new URL('/admin/login', req.url)
    // relative path (req.url resolves to internal 0.0.0.0:3000 behind the proxy)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return pass()
}

export const config = {
  // 페이지 전부(CSP). 인증은 위에서 /admin·/maps만 건다 — /maps는 비공개 개인 도구(가고 싶은 곳 지도)라 admin과 동일.
  // API·정적 파일·이미지·업로드는 HTML이 아니라 CSP가 필요 없고, nonce 때문에 캐시를 깨지 않도록 뺀다.
  // house/는 public에 둔 독립 정적 페이지(atimevil/youth-housing-map)라 인라인 스크립트·카카오맵 SDK를
  // 쓴다. nonce CSP를 붙이면 막히므로 빼고, next.config의 기본 보안 헤더만 받는다.
  matcher: ['/((?!api/|_next/static|_next/image|uploads/|house|icon\\.svg|opengraph-image|robots\\.txt|sitemap\\.xml|rss\\.xml).*)'],
}
