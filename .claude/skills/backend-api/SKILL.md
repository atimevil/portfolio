---
name: backend-api
description: 포트폴리오 백엔드 API를 구현하는 스킬. Next.js API Routes로 연락 폼 처리와 이메일 발송 기능을 구현한다. "백엔드 API", "연락 폼 처리", "이메일 발송", "서버 기능", "API Routes", "rate limiting" 요청 시 반드시 이 스킬을 사용할 것.
---

## 포트폴리오 백엔드 원칙
포트폴리오는 콘텐츠 중심이므로 백엔드를 최소화한다. 정적 데이터는 `src/data/`에서 관리하고, **동적 기능만** API Route로 구현한다.

## 실행 순서

### 1. 필요 기능 파악
`_workspace/01_wireframer_wireframes.md`를 읽어 어떤 서버 기능이 필요한지 확인한다.

일반적인 포트폴리오 API:
- **연락 폼** `/api/contact` — 이메일 발송 (필수)
- **뷰 카운터** `/api/views` — 선택적

### 2. API 스펙 먼저 문서화
구현 전에 `_workspace/04_backend-dev_api-spec.md`를 작성한다:
```markdown
## POST /api/contact
요청: { name: string, email: string, message: string }
응답 200: { success: true }
응답 400: { error: string }
응답 429: { error: "Too many requests" }
응답 500: { error: "Internal server error" }
```

### 3. 연락 폼 API 구현

```typescript
// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name:    z.string().min(2).max(50),
  email:   z.string().email(),
  message: z.string().min(10).max(1000),
});

// 간단한 In-memory rate limiting (Vercel Edge 환경에서는 Upstash Redis 권장)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 }); // 1분 윈도우
    return true;
  }
  if (entry.count >= 3) return false; // 분당 3회 제한
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, email, message } = result.data;

  try {
    await sendEmail({ name, email, message });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. 이메일 발송 (Resend 권장)

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  name, email, message
}: { name: string; email: string; message: string }) {
  await resend.emails.send({
    from:    'portfolio@yourdomain.com',
    to:      process.env.CONTACT_EMAIL!,
    subject: `[포트폴리오] 새 메시지: ${name}`,
    html: `
      <h2>새 연락 메시지</h2>
      <p><strong>이름:</strong> ${name}</p>
      <p><strong>이메일:</strong> ${email}</p>
      <p><strong>메시지:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  });
}
```

### 5. 환경 변수 문서화
`.env.example`:
```env
# Resend (https://resend.com)
RESEND_API_KEY=re_...

# 연락 메시지를 받을 이메일
CONTACT_EMAIL=your@email.com
```

### 6. 패키지 설치
```bash
npm install resend zod
```

## 상세 패턴
Nodemailer 대안, Upstash Rate Limiting, 응답 타입 통일은 `references/api-patterns.md` 참조.
