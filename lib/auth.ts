import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/auth-password'
import { isLocked, recordFailure, recordSuccess } from '@/lib/rate-limit'

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
        const ip =
          (req?.headers?.['x-real-ip'] as string | undefined)?.trim() ||
          (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',').pop()?.trim() ||
          'unknown'
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
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  // NOTE: no custom `cookies` override on purpose. Over HTTPS, NextAuth uses
  // the `__Secure-next-auth.session-token` cookie and getToken() looks for that
  // same name — forcing the non-secure name here breaks middleware auth.
  secret: process.env.NEXTAUTH_SECRET,
}
