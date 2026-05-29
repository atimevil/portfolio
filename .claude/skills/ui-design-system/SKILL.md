---
name: ui-design-system
description: 포트폴리오 웹사이트의 시각적 디자인 시스템을 구축하는 스킬. 색상 팔레트, 타이포그래피, 간격 시스템을 CSS Custom Properties와 Tailwind 설정으로 정의한다. "디자인 시스템", "색상 팔레트", "타이포그래피 설정", "테마 만들어줘", "스타일 가이드", "다크모드 설정" 요청 시 반드시 이 스킬을 사용할 것.
---

## 목적
포트폴리오 전체에 시각적 일관성을 보장하는 디자인 토큰과 컴포넌트 스펙을 정의한다. 개발자가 이 문서만 보고도 픽셀 단위 구현이 가능하도록 상세하게 작성한다.

## 실행 단계

### 1. 와이어프레임 분석
`_workspace/01_wireframer_wireframes.md`를 읽어 필요한 컴포넌트 유형과 섹션 구조를 파악한다.

### 2. 색상 팔레트 정의
스타일 키워드를 기반으로 Primary 색상을 선택하고 전체 팔레트를 구성한다:

```css
/* globals.css */
:root {
  /* Primary (예: 미니멀 → 블루, 크리에이티브 → 퍼플, 기업형 → 네이비) */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;

  /* Neutral */
  --color-gray-50:  #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;

  /* Semantic */
  --color-bg:       var(--color-gray-50);
  --color-bg-card:  #ffffff;
  --color-text:     var(--color-gray-900);
  --color-text-muted: var(--color-gray-500);
  --color-accent:   var(--color-primary-500);
  --color-border:   var(--color-gray-200);
}

[data-theme="dark"] {
  --color-bg:       #0f172a;
  --color-bg-card:  #1e293b;
  --color-text:     #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-border:   #334155;
}
```

### 3. 타이포그래피 스케일
```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:   0.75rem;   /* 12px */
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.25rem;   /* 20px */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  1.875rem;  /* 30px */
  --text-4xl:  2.25rem;   /* 36px */
  --text-6xl:  3.75rem;   /* 60px */

  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

### 4. 간격 시스템 (4px 베이스 그리드)
| 토큰 | 값 |
|------|----|
| spacing-1 | 4px |
| spacing-2 | 8px |
| spacing-4 | 16px |
| spacing-6 | 24px |
| spacing-8 | 32px |
| spacing-12 | 48px |
| spacing-16 | 64px |
| spacing-20 | 80px |

### 5. 컴포넌트 스펙

**Button:**
```
Primary: bg-accent, text-white, rounded-lg, px-6 py-3
         hover: bg-primary-600, transition-colors 200ms
Secondary: border border-accent, text-accent, rounded-lg, px-6 py-3
           hover: bg-primary-50 dark:bg-primary-900/20
```

**ProjectCard:**
```
border border-border, rounded-xl, overflow-hidden
hover: border-accent, shadow-lg, transition 300ms
이미지 영역: aspect-video, object-cover
hover 오버레이: bg-gradient from-black/80 opacity-0 → opacity-100
```

**NavBar:**
```
position: fixed, top-0, w-full, z-50
기본: bg-transparent
스크롤 후: bg-bg/90 backdrop-blur border-b border-border
모바일: 햄버거 메뉴 (AnimatePresence)
```

**SkillBadge:**
```
inline-flex, rounded-full, px-3 py-1
bg-primary-50 dark:bg-primary-900/30, text-primary-600 dark:text-primary-400
text-sm font-medium
```

### 6. Tailwind Config
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          900: 'var(--color-primary-900)',
        },
        accent: 'var(--color-accent)',
        bg: {
          DEFAULT: 'var(--color-bg)',
          card: 'var(--color-bg-card)',
        },
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
};
```

## 출력 형식
`_workspace/02_designer_design-system.md`에 모든 섹션을 코드 블록과 함께 저장한다.
