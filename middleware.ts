import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
})

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // next-intl 처리
  const intlResponse = intlMiddleware(req)

  // 관리자 경로 인증 보호 (로그인 페이지 제외)
  const isAdminRoute = /^\/(?:ko|en)\/admin/.test(pathname)
  const isLoginPage = /^\/(?:ko|en)\/admin\/login/.test(pathname)

  if (isAdminRoute && !isLoginPage) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const locale = pathname.startsWith('/en') ? 'en' : 'ko'
      const loginUrl = new URL(`/${locale}/admin/login`, req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // devMode 방문자 차단
  if (!pathname.includes('/admin') && !pathname.startsWith('/api')) {
    try {
      const settingsPath = `${process.cwd()}/content/settings.json`
      const { readFileSync, existsSync } = await import('fs')
      if (existsSync(settingsPath)) {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
        if (settings.devMode) {
          const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
          if (!token) {
            const locale = pathname.startsWith('/en') ? 'en' : 'ko'
            return NextResponse.rewrite(new URL(`/${locale}/admin/login`, req.url))
          }
        }
      }
    } catch {
      // settings 읽기 실패 시 정상 진행
    }
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
