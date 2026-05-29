---
name: deploy-pipeline
description: 포트폴리오 웹사이트 배포 파이프라인을 구성하는 스킬. Vercel 배포, GitHub Actions CI/CD, robots.txt, sitemap.xml을 설정한다. "배포해줘", "CI/CD 설정", "GitHub Actions", "Vercel 설정", "도메인 연결", "sitemap 만들어줘", "빌드 파이프라인" 요청 시 반드시 이 스킬을 사용할 것.
---

## 배포 전략
- **플랫폼**: Vercel (Next.js 최적 호환, 무료 티어 제공)
- **CI**: GitHub Actions (PR 시 자동 lint + typecheck + build)
- **브랜치**: `main` → 자동 프로덕션 배포, PR → Preview 배포

## 실행 단계

### 1. QA 통과 확인
`_workspace/05_qa-engineer_bug-report.md`를 읽어 Critical + High 버그가 0건인지 확인한다.

### 2. GitHub Actions CI 설정
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          # 빌드 시 필요한 환경 변수 (실제 값은 GitHub Secrets에서)
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CONTACT_EMAIL:  ${{ secrets.CONTACT_EMAIL }}
```

### 3. next.config.js 최적화
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 외부 이미지 도메인 추가 (사용 시)
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options',    value: 'nosniff' },
        { key: 'X-Frame-Options',           value: 'DENY' },
        { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

module.exports = nextConfig;
```

### 4. SEO 파일 생성

**robots.txt** (`public/robots.txt`):
```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

**sitemap.ts** (`src/app/sitemap.ts`):
```typescript
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
```

### 5. 배포 가이드 문서 생성
`_workspace/06_deploy-engineer_deploy-guide.md`:

```markdown
# 포트폴리오 배포 가이드

## 1단계: Vercel 연결
1. vercel.com 접속 → New Project
2. GitHub 레포지토리 선택
3. Framework: Next.js (자동 감지됨)
4. Build Command: `npm run build` (기본값)
5. Deploy 클릭

## 2단계: 환경 변수 설정
Vercel Dashboard → Settings → Environment Variables:
- RESEND_API_KEY (Production + Preview)
- CONTACT_EMAIL (Production + Preview)

## 3단계: 커스텀 도메인 (선택)
Vercel Dashboard → Domains → 도메인 추가

## GitHub Secrets 설정 (CI용)
Repository → Settings → Secrets and variables → Actions:
- RESEND_API_KEY
- CONTACT_EMAIL

## 성능 목표
- Lighthouse Performance: 90+
- First Contentful Paint: < 2s
- Time to Interactive: < 3s
```

## 상세 Vercel 설정
`references/vercel.md` 참조.
