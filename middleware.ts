import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Edge runtime — only does admin auth (getToken is Edge-safe). devMode blocking
// lives in app/(site)/layout.tsx because it needs to read content/settings.json,
// which the Edge runtime cannot do.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
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
  matcher: ['/admin/:path*', '/maps'],
}
