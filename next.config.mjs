/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // 응답에 "X-Powered-By: Next.js"를 붙이지 않는다(버전 노출)
  // sanitize-html(CommonJS)가 htmlparser2(ESM)를 require → 서버 전용으로 번들에서 제외
  experimental: {
    serverComponentsExternalPackages: ['sanitize-html'],
  },
  // next/image를 쓰지 않는다(새 업로드가 standalone에서 404 나서 정적 썸네일 + <img>로 바꿈).
  // 최적화 API(/_next/image)를 꺼둔다 — 열려 있으면 14.2.x에 남은 이미지 최적화 취약점이 그대로 닿는다.
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 한 번 HTTPS로 들어온 브라우저는 1년간 http:// 링크도 HTTPS로만 연다(이 주소에만 적용).
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // 스크립트 출처까지 막는 CSP는 인라인 스크립트(테마 등)에 nonce가 필요해 아직 안 넣는다.
          // 아래는 깨지는 것 없이 넣을 수 있는 부분: 다른 사이트의 iframe 삽입·플러그인·<base> 바꿔치기·외부로 폼 전송 금지.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
