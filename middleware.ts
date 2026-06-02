import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 관리자 경로 인증 보호 (로그인 페이지 제외)
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      // Use the relative path (not req.url, which resolves to the internal
      // 0.0.0.0:3000 host behind the proxy) so post-login returns to /admin.
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // devMode 방문자 차단
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    try {
      const settingsPath = `${process.cwd()}/content/settings.json`
      const { readFileSync, existsSync } = await import('fs')
      if (existsSync(settingsPath)) {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
        if (settings.devMode) {
          const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
          if (!token) {
            return NextResponse.rewrite(new URL('/admin/login', req.url))
          }
        }
      }
    } catch {
      // settings 읽기 실패 시 정상 진행
    }
  }

  return NextResponse.next()
}

export const config = {
  // Exclude internals, API, and the file-convention metadata route
  // opengraph-image (robots.txt / sitemap.xml already excluded by the dot rule).
  matcher: ['/((?!_next|api|opengraph-image|.*\\..*).*)'],
}
