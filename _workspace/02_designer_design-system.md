# 포트폴리오 디자인 시스템

## 색상 팔레트

### CSS Custom Properties
```css
:root {
  /* Primary */
  --color-primary:        #2563EB; /* blue-600 */
  --color-primary-hover:  #1D4ED8; /* blue-700 */
  --color-primary-light:  #DBEAFE; /* blue-100 */

  /* Neutral */
  --color-bg:             #FFFFFF;
  --color-bg-secondary:   #F9FAFB; /* gray-50 */
  --color-surface:        #F3F4F6; /* gray-100 */
  --color-border:         #E5E7EB; /* gray-200 */

  /* Text */
  --color-text-primary:   #111827; /* gray-900 */
  --color-text-secondary: #6B7280; /* gray-500 */
  --color-text-muted:     #9CA3AF; /* gray-400 */

  /* Semantic */
  --color-success:        #10B981; /* emerald-500 */
  --color-warning:        #F59E0B; /* amber-500 */
  --color-danger:         #EF4444; /* red-500 */
  --color-info:           #3B82F6; /* blue-500 */
}

.dark {
  --color-primary:        #3B82F6; /* blue-500 */
  --color-primary-hover:  #2563EB; /* blue-600 */
  --color-primary-light:  #1E3A5F;

  --color-bg:             #0F172A; /* slate-900 */
  --color-bg-secondary:   #1E293B; /* slate-800 */
  --color-surface:        #334155; /* slate-700 */
  --color-border:         #475569; /* slate-600 */

  --color-text-primary:   #F1F5F9; /* slate-100 */
  --color-text-secondary: #94A3B8; /* slate-400 */
  --color-text-muted:     #64748B; /* slate-500 */
}
```

### Tailwind 색상 설정
```js
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: 'var(--color-primary)',
    hover:   'var(--color-primary-hover)',
    light:   'var(--color-primary-light)',
  },
  bg: {
    DEFAULT:   'var(--color-bg)',
    secondary: 'var(--color-bg-secondary)',
    surface:   'var(--color-surface)',
  },
  border: 'var(--color-border)',
  text: {
    primary:   'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted:     'var(--color-text-muted)',
  },
}
```

---

## 타이포그래피

```css
/* 폰트 패밀리 */
--font-sans: 'Pretendard', 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* 스케일 */
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
```

| 용도 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 페이지 제목 | 2xl~3xl | 700 | text-primary |
| 섹션 제목 | xl~2xl | 600 | text-primary |
| 블로그 제목 | xl | 600 | text-primary |
| 본문 | base | 400 | text-primary |
| 부제목/메타 | sm | 400 | text-secondary |
| 태그/배지 | xs | 500 | text-secondary |
| 코드 | sm | 400 | font-mono |

---

## 스페이싱 시스템

Tailwind 기본 스케일 사용 (4px 단위):
- `gap-4` = 16px (컴포넌트 내부)
- `gap-6` = 24px (섹션 내부)
- `gap-8` = 32px (섹션 간)
- `px-4/px-6` = 모바일 패딩
- `px-8` = 데스크탑 패딩
- `max-w-5xl mx-auto` = 페이지 최대 너비 (1024px)

---

## 컴포넌트 스펙

### BlogCard
```
배경: bg-secondary
border: border + rounded-lg
hover: shadow-md + -translate-y-0.5 (Framer Motion)
padding: p-5
태그: Badge 컴포넌트 (파란색 계열)
```

### Badge / Tag
```
기술스택 배지: bg-primary-light text-primary text-xs px-2 py-0.5 rounded-full
블로그 태그: bg-surface text-secondary text-xs px-2 py-0.5 rounded-md
```

### Button
```
Primary:   bg-primary text-white hover:bg-primary-hover rounded-md px-4 py-2
Secondary: border border-border text-text-primary hover:bg-surface rounded-md px-4 py-2
Danger:    bg-danger text-white hover:bg-red-600 rounded-md px-4 py-2
```

### Card (공통 컨테이너)
```
bg-bg border border-border rounded-xl p-5 shadow-sm
dark: bg-bg-secondary
```

### NavBar
```
sticky top-0 z-50
배경: bg-bg/80 backdrop-blur-sm
border-bottom: border-b border-border
height: h-16
```

### Sidebar
```
너비: w-72 (데스크탑), 숨김 (모바일)
프로필 사진: w-20 h-20 rounded-full object-cover
기술 배지: flex flex-wrap gap-2
```

### 관리자 레이아웃
```
사이드 네비: w-56 bg-bg-secondary border-r border-border
콘텐츠 영역: flex-1 p-6
활성 메뉴: bg-primary-light text-primary rounded-md
```

---

## 애니메이션 (Framer Motion)

```ts
// 페이지 진입
export const pageVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// 카드 리스트 stagger
export const listVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// 호버
export const hoverVariants = {
  rest:  { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
};
```

---

## 다크모드 전략

- Tailwind `darkMode: 'class'`
- `<html>` 요소에 `.dark` 클래스 토글
- 초기값: `localStorage.getItem('theme')` → 없으면 `prefers-color-scheme`
- ThemeToggle: 아이콘 전환 (🌙/☀️)
- 모든 색상은 CSS Custom Properties 기반 → 클래스 한 번으로 전체 전환

---

## MDX 스타일 (블로그 본문)

```css
/* prose 커스터마이징 */
.prose {
  --prose-body: var(--color-text-primary);
  --prose-headings: var(--color-text-primary);
  --prose-links: var(--color-primary);
  --prose-code: #e11d48;         /* rose-600 */
  --prose-pre-bg: #1e293b;       /* slate-800 */
  --prose-pre-code: #e2e8f0;
  --prose-quote-border: var(--color-primary);
}
```

코드 블록: `rehype-pretty-code` + Shiki (theme: `github-dark-dimmed`)

---

## next.config 이미지 도메인
```js
images: {
  domains: ['localhost'],
  remotePatterns: [
    { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/uploads/**' },
  ],
}
```
