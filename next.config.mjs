/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // 응답에 "X-Powered-By: Next.js"를 붙이지 않는다(버전 노출)
  // sanitize-html(CommonJS)가 htmlparser2(ESM)를 require → 서버 전용으로 번들에서 제외
  experimental: {
    serverComponentsExternalPackages: ['sanitize-html'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'foxibu.is-a.dev',
        pathname: '/uploads/**',
      },
    ],
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
