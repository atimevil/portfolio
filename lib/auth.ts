import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword, passwordVersion } from '@/lib/auth-password'
import { ipKey, isLocked, recordFailure, recordSuccess } from '@/lib/rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // nginx가 설정하는 X-Real-IP는 실제 TCP 접속 IP라 클라이언트가 못 바꾼다.
        // (X-Forwarded-For의 첫 값은 클라이언트가 주입 가능 → 레이트리밋 우회됨)
        const ip = ipKey(
          (req?.headers?.['x-real-ip'] as string | undefined)?.trim() ||
          (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',').pop()?.trim() ||
          'unknown',
        )
        // 잠금 중이면 비밀번호가 맞아도 거부 (정보 노출 방지 위해 동일하게 null)
        if (isLocked(ip)) return null
        if (credentials?.password && verifyPassword(credentials.password)) {
          recordSuccess(ip)
          return { id: '1', name: 'Admin', email: 'admin@portfolio' }
        }
        recordFailure(ip)
        return null
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    // 로그인할 때(user가 있을 때)만 그 시점의 비밀번호 버전을 토큰에 적는다. 검사는 lib/session.ts·proxy.ts가 한다.
    jwt({ token, user }) {
      if (user) token.pv = passwordVersion()
      return token
    },
    session({ session, token }) {
      session.pv = token.pv
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  // NOTE: no custom `cookies` override on purpose. Over HTTPS, NextAuth uses
  // the `__Secure-next-auth.session-token` cookie and getToken() looks for that
  // same name — forcing the non-secure name here breaks proxy.ts auth.
  secret: process.env.NEXTAUTH_SECRET,
}
