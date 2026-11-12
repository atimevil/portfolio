import 'next-auth'
import 'next-auth/jwt'

// 로그인 시점의 비밀번호 버전(lib/auth-password의 passwordVersion). lib/session.ts·proxy.ts가 지금 버전과 비교한다.
declare module 'next-auth' {
  interface Session {
    pv?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    pv?: string
  }
}
