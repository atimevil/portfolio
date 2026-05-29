# Vercel 배포 상세 가이드

## 초기 설정
1. vercel.com → New Project → GitHub 레포 선택
2. Framework Preset: Next.js (자동 감지)
3. Build Command: `npm run build` (기본값)
4. Output Directory: `.next` (기본값)
5. Install Command: `npm ci`

## 환경 변수
- Vercel Dashboard → Settings → Environment Variables
- **Production / Preview / Development** 구분하여 설정
- Preview 배포에도 환경 변수 적용해야 연락 폼 테스트 가능

## Preview 배포
- PR 생성 시 Vercel이 자동으로 preview URL 생성
- GitHub PR에 배포 URL이 코멘트로 추가됨
- 팀 코드 리뷰 전에 시각적 확인 가능

## Vercel Analytics
무료 티어: Core Web Vitals 자동 수집
```javascript
// src/app/layout.tsx에 추가
import { Analytics } from '@vercel/analytics/react';
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```
`npm install @vercel/analytics`

## Speed Insights
```javascript
import { SpeedInsights } from '@vercel/speed-insights/next';
// layout.tsx에 <SpeedInsights /> 추가
```
`npm install @vercel/speed-insights`

## vercel.json (필요 시)
리다이렉트, 헤더 추가 설정이 필요한 경우:
```json
{
  "redirects": [
    { "source": "/resume", "destination": "/resume.pdf", "permanent": false }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/(.*).(jpg|jpeg|gif|png|svg|ico|webp|avif)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```
