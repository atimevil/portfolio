# API 구현 상세 패턴

## Nodemailer 대안 (Gmail)
Resend 대신 기존 Gmail을 사용할 때:

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (2FA 필요)
  },
});

// .env.example 추가:
// GMAIL_USER=your@gmail.com
// GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

## Upstash Redis Rate Limiting (Vercel Edge 권장)
In-memory Map은 서버리스 환경에서 재시작 시 초기화되므로, 프로덕션에서는 Upstash를 사용한다:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 m'),
});

// route.ts에서:
const { success } = await ratelimit.limit(ip);
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

// .env.example 추가:
// UPSTASH_REDIS_REST_URL=
// UPSTASH_REDIS_REST_TOKEN=
```

## 응답 타입 통일
```typescript
// src/types/api.ts
export type ApiSuccess<T = void> = T extends void
  ? { success: true }
  : { success: true; data: T };

export type ApiError = {
  error: string;
  code?: string;
};
```

## 환경 변수 타입 안전성
```typescript
// src/lib/env.ts — 런타임 환경 변수 검증
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

export const env = {
  resendApiKey:   () => requireEnv('RESEND_API_KEY'),
  contactEmail:   () => requireEnv('CONTACT_EMAIL'),
};
```
