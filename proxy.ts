import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Next 16에서 middleware.ts가 proxy.ts로 이름이 바뀌었다(동작은 같다). 관리자 인증과 /en 로케일 표시만 한다.
// devMode 차단은 content/settings.json을 읽어야 해서 app/(site)/layout.tsx에 있다.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 영문 페이지는 인증과 무관하다. 루트 레이아웃의 <html lang>이 읽을 로케일만 표시하고 통과시킨다.
  // (아래 인증 분기로 흘러가면 비로그인 방문자가 로그인 페이지로 튕긴다)
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const headers = new Headers(req.headers)
    headers.set('x-locale', 'en')
    return NextResponse.next({ request: { headers } })
  }

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

  return NextResponse.next()
}

export const config = {
  // /maps는 비공개 개인 도구(가고 싶은 곳 지도)라 admin과 동일하게 로그인을 요구한다.
  matcher: ['/admin/:path*', '/maps', '/en', '/en/:path*'],
}
