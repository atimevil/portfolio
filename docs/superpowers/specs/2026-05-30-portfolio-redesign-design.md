# 포트폴리오 리디자인 설계 문서

**날짜:** 2026-05-30  
**상태:** 승인됨

---

## 개요

기존 포트폴리오(Next.js 14 + TypeScript)를 Minimal Mistakes 스타일 기반으로 전면 재설계한다. 핵심 방향은 **모노톤 다크모드 기본 + 왼쪽 사이드바 + 텍스트 중심 블로그 레이아웃**이다.

---

## 1. 구조 변경 (Architecture)

### 제거
- `next-intl` 패키지 완전 제거
- `app/[locale]/` 라우팅 구조 → `app/` 로 단순화
- `messages/ko.json`, `messages/en.json` 삭제
- `LangToggle` 컴포넌트 삭제
- `middleware.ts` i18n 로직 제거

### 변경
| 기존 | 변경 후 |
|------|---------|
| `app/[locale]/page.tsx` | `app/page.tsx` |
| `app/[locale]/blog/[slug]/page.tsx` | `app/blog/[slug]/page.tsx` |
| `app/[locale]/about/page.tsx` | `app/about/page.tsx` |
| `app/[locale]/gallery/page.tsx` | `app/gallery/page.tsx` |
| `app/[locale]/admin/**` | `app/admin/**` |

### 추가
- `content/views.json` — 글별 조회수 저장 (`{ "slug": count }`)
- `app/api/views/route.ts` — GET(조회수 읽기) / POST(조회수 증가)
- `app/admin/categories/page.tsx` — 카테고리 관리 페이지
- `components/admin/AdminCategoryManager.tsx`

### 유지
- `content/` 파일시스템 CMS 구조
- NextAuth.js Credentials 인증
- Docker + Nginx 배포 설정
- 기존 API Routes (`/api/blog`, `/api/projects`, `/api/gallery`, `/api/settings`)

---

## 2. 색상 시스템

### 다크모드 (기본값)
```css
--color-bg:             #0a0a0a;
--color-surface:        #141414;
--color-border:         #262626;
--color-text-primary:   #ededed;
--color-text-secondary: #a3a3a3;
--color-text-muted:     #525252;
```

### 라이트모드 (토글)
```css
--color-bg:             #ffffff;
--color-surface:        #fafafa;
--color-border:         #e5e5e5;
--color-text-primary:   #171717;
--color-text-secondary: #737373;
--color-text-muted:     #a3a3a3;
```

**강조색(파란색) 완전 제거.** 링크는 `text-primary` + hover 시 underline만 사용.

---

## 3. 레이아웃 시스템

### 공통 페이지 레이아웃
```
┌─────────────────────────────────────────┐
│  NavBar (sticky)                        │
├──────────────┬──────────────────────────┤
│  Sidebar     │  콘텐츠 영역             │
│  (w-64 고정) │  (스크롤)               │
│              │                          │
│  프로필 사진 │                          │
│  이름        │                          │
│  소개        │                          │
│  소셜 링크   │                          │
└──────────────┴──────────────────────────┘
```
- 사이드바: 왼쪽 고정 (`w-64`), 데스크탑(`lg:` 1024px+)에서만 표시
- 모바일: 사이드바 숨김, NavBar 아래 이름 + 소개 한 줄 텍스트로만 표시 (별도 컴포넌트 불필요)
- 최대 너비: `max-w-5xl mx-auto`

### NavBar
- 배경: `--color-bg` (다크/라이트 단색, blur 없음)
- border-bottom: `1px solid --color-border`
- 높이: `h-14`
- 좌측: 이름/로고
- 우측: 블로그 · 소개 · 갤러리 + 슬라이드 토글 스위치
- **파란 강조색 없음**, 텍스트 링크만

### 다크모드 토글
- 슬라이드 스위치 (`w-11 h-6` 기준)
- 다크: 어두운 배경 + 오른쪽 흰 원
- 라이트: 밝은 배경 + 왼쪽 어두운 원
- 초기값: `localStorage` → 없으면 `prefers-color-scheme` → 없으면 dark

### Sidebar 컴포넌트
```
프로필 사진 (w-20 h-20, 원형)
이름 (font-bold)
한 줄 소개 (text-secondary)
─────────────────
GitHub 링크
이메일 링크
LinkedIn 링크 (선택)
```
기술스택 배지, 최근 프로젝트 목록 **제거** (About 페이지로 이동).

---

## 4. 페이지별 설계

### 메인 페이지 (`/`)
- 좌측 Sidebar + 우측 블로그 글 목록
- 글 목록: 구분선(`border-bottom`) 스타일
  ```
  글 제목 (font-semibold, hover underline)
  날짜 · 읽기 시간
  미리보기 텍스트 (1~2줄, text-secondary)
  ```
- 카드 UI, 배지, Framer Motion 호버 애니메이션 **제거**
- 페이지네이션 유지 (`?page=N`)

### 블로그 상세 (`/blog/[slug]`)
- 좌측 Sidebar(동일) + 우측 본문 영역 (너비 ~75%)
- 상단: 제목 + 날짜 + 읽기 시간 (조회수 비표시)
- 본문: MDX 렌더링
  - 코드 하이라이팅: `rehype-pretty-code` + Shiki 유지
  - **수식 지원 추가**: `remark-math` + `rehype-katex`
  - KaTeX CSS 로드: `app/layout.tsx` 에 `import 'katex/dist/katex.min.css'` 추가
  - 다크모드에서 KaTeX 색상 CSS 변수로 조정
- 이전/다음 글 링크 하단 유지

### About (`/about`)
- 구조 유지: 프로필 상단 + 프로젝트 3컬럼 + 활동/수상 2컬럼
- 색상만 새 모노톤 테마로 교체
- 사이드바 없음 (풀 너비)

### 갤러리 (`/gallery`)
- 구조 유지: 카테고리 필터 + 4컬럼 그리드 + 모달
- 색상만 새 테마로 교체 (필터 탭 파란색 → 모노톤)
- 사이드바 없음 (풀 너비)

---

## 5. 관리자 페이지

### 변경
- 언어 관련 설정 항목 제거 (다국어 제거)
- 프로필 이미지 업로드 실제 연결: `POST /api/settings/avatar` (multipart/form-data) → `public/uploads/profile/avatar.{ext}` 저장, `settings.json`의 `avatarUrl` 업데이트

### 추가

**대시보드 (`/admin`)**
- 글별 조회수 표시: `글 제목 · 142 views`
- `views.json` 읽어서 상위 5개 표시

**카테고리 관리 (`/admin/categories`)**
- 카테고리 목록 (이름, 글 수)
- 카테고리 추가/삭제
- `content/categories.json` 파일로 관리
- 글 작성/수정 시 카테고리 선택 가능

### 조회수 구현
```
// content/views.json
{ "hello-world": 42, "next-js-tips": 128 }

// GET /api/views?slug=hello-world  → { count: 42 }
// POST /api/views  body: { slug }  → { count: 43 }
```
- 블로그 상세 페이지 진입 시 자동 increment
- 관리자 대시보드에서만 표시

### 유지
- 블로그 글 작성/수정 (Tiptap WYSIWYG)
- 프로젝트 CRUD
- 갤러리 이미지 업로드/삭제
- devMode 토글

---

## 6. MDX 플러그인 설정

```ts
// next.config.ts (또는 mdx 설정)
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const mdxOptions = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex, rehypePrettyCode],
};
```

사용 예:
```mdx
인라인 수식: $E = mc^2$

블록 수식:
$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
$$
```

---

## 7. 제거 목록 (요약)

| 항목 | 이유 |
|------|------|
| `next-intl` + i18n 라우팅 | 한국어 단일 언어로 단순화 |
| `LangToggle` 컴포넌트 | i18n 제거에 따라 |
| 파란색 강조색 (`#2563EB`) | 모노톤 테마로 전환 |
| BlogCard 카드 UI (border, shadow) | 구분선 리스트로 교체 |
| 기술스택 배지 (사이드바) | About 페이지로 통합 |
| 최근 프로젝트 (사이드바) | About 페이지로 통합 |
| Framer Motion BlogCard 호버 | 미니멀 스타일에 불필요 |
| NavBar backdrop-blur + 파란색 | 단색 NavBar로 교체 |

---

## 8. 유지 목록 (요약)

- NextAuth.js 인증 + devMode 차단
- Docker + Nginx 배포 설정
- 파일시스템 CMS (`content/`)
- Tiptap WYSIWYG 에디터
- 갤러리 모달, 카테고리 필터
- About 페이지 구조 (프로필 + 프로젝트 + 활동/수상)
- 코드 하이라이팅 (rehype-pretty-code + Shiki)
- Pretendard + JetBrains Mono 폰트
