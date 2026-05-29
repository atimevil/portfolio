---
name: frontend-build
description: 포트폴리오 Next.js 프론트엔드를 구현하는 스킬. 와이어프레임과 디자인 시스템 기반으로 React 컴포넌트, 페이지, 애니메이션을 실제 코드로 작성한다. "프론트엔드 개발", "컴포넌트 만들어줘", "페이지 구현", "UI 코딩", "Next.js 작성" 요청 시 반드시 이 스킬을 사용할 것.
---

## 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript (strict mode)
- **스타일**: Tailwind CSS
- **애니메이션**: Framer Motion
- **아이콘**: Lucide React
- **폼**: React Hook Form + Zod

## 실행 순서

### 1. 스펙 파일 읽기 (필수)
`_workspace/01_wireframer_wireframes.md`와 `_workspace/02_designer_design-system.md`를 **모두** 읽는다. 이 단계를 건너뛰면 안 된다.

### 2. 프로젝트 초기화
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
# 또는 기존 프로젝트에 추가 패키지 설치
npm install framer-motion lucide-react react-hook-form zod
```

프로젝트 구조 생성:
```
src/
├── app/
│   ├── layout.tsx        # 루트 레이아웃 + ThemeProvider
│   ├── page.tsx          # 메인 페이지 (섹션 조합)
│   └── globals.css       # CSS Custom Properties (디자인 시스템)
├── components/
│   ├── ui/               # 원자 컴포넌트
│   ├── sections/         # 페이지 섹션
│   └── layout/           # NavBar, Footer
├── data/
│   └── portfolio.ts      # 포트폴리오 콘텐츠
└── types/
    └── index.ts
```

### 3. 타입 정의 먼저
```typescript
// src/types/index.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  imageUrl: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}

export interface Skill {
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'tools';
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}
```

### 4. 컴포넌트 구현 원칙
- **Server Components 우선** — 데이터 fetch가 없으면 기본적으로 Server Component
- **`'use client'`는 인터랙션이 필요한 컴포넌트에만** (NavBar, ContactForm, 애니메이션 컴포넌트)
- **섹션 컨테이너 패턴** 통일:

```tsx
// 모든 섹션의 기본 패턴
<section id="section-id" className="py-20 px-4">
  <div className="max-w-6xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* 콘텐츠 */}
    </motion.div>
  </div>
</section>
```

### 5. 포트폴리오 데이터 분리
모든 콘텐츠(프로젝트 목록, 기술 스택, 소개글)를 `src/data/portfolio.ts`에 보관한다. 컴포넌트에 텍스트를 하드코딩하지 않는다.

### 6. SEO 설정
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: { default: '[이름] | [직군]', template: '%s | [이름]' },
  description: '[한 줄 소개]',
  openGraph: { images: ['/og-image.png'] },
};
```

### 7. 다크모드 토글
`<html>` 태그에 `data-theme` 속성으로 제어한다:
```typescript
document.documentElement.setAttribute('data-theme', 'dark');
```
`localStorage`에 사용자 선호를 저장하고, 초기 로드 시 시스템 설정을 감지한다.

### 8. 완료 후 검증
```bash
npm run build   # 빌드 성공 확인
npx tsc --noEmit  # 타입 에러 없음 확인
```
실패 시 즉시 수정하고 재검증한다.

## 컴포넌트별 상세 패턴
복잡한 컴포넌트(NavBar 스크롤 감지, ProjectCard hover 오버레이, ContactForm 상태 관리)의 구현 패턴은 `references/component-patterns.md` 참조.
