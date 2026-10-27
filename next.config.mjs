/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // 응답에 "X-Powered-By: Next.js"를 붙이지 않는다(버전 노출)
  // sanitize-html(CommonJS)가 htmlparser2(ESM)를 require → 서버 전용으로 번들에서 제외
  serverExternalPackages: ['sanitize-html'],
  // next/image를 쓰지 않는다(새 업로드가 standalone에서 404 나서 정적 썸네일 + <img>로 바꿈).
  // 최적화 API(/_next/image)는 쓰지 않으니 꺼둔다 — 쓰지 않는 공격 지점을 열어둘 이유가 없다.
  images: {
    unoptimized: true,
  },
  // 청년주택 지도(public/youth-housing/index.html, atimevil/youth-housing-map에서 빌드해 복사)를 폴더 주소로 연다.
  async rewrites() {
    return [{ source: '/youth-housing', destination: '/youth-housing/index.html' }]
  },
  // 프로젝트 상세는 /work/<slug>만 있다. 주소 끝을 지워 /work로 오면 404 대신 프로젝트 목록이 있는 소개로 보낸다.
  async redirects() {
    return [
      { source: '/work', destination: '/about', permanent: false },
      { source: '/en/work', destination: '/en/about', permanent: false },
    ]
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
          // 기본 CSP: 다른 사이트의 iframe 삽입·플러그인·<base> 바꿔치기·외부로 폼 전송 금지.
          // 페이지 응답에는 proxy.ts가 같은 내용에 nonce 기반 script-src를 더한 CSP를 붙인다(lib/csp.ts).
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
