import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/auth-password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.password && verifyPassword(credentials.password)) {
          return { id: '1', name: 'Admin', email: 'admin@portfolio' }
        }
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
