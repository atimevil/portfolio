# 프론트엔드 컴포넌트 목록

## 생성된 파일 구조

```
app/
├── globals.css
├── layout.tsx                          ← 루트 레이아웃 (html 태그 없음, children 반환)
├── sitemap.ts
├── [locale]/
│   ├── layout.tsx                      ← 다국어 레이아웃 (html, NextIntlClientProvider)
│   ├── page.tsx                        ← 메인 (블로그 목록 + 사이드바)
│   ├── blog/[slug]/page.tsx            ← 블로그 상세
│   ├── about/page.tsx                  ← 소개 (프로필, 프로젝트, 활동, 수상)
│   ├── gallery/page.tsx                ← 갤러리
│   └── admin/
│       ├── login/page.tsx              ← 로그인
│       ├── page.tsx                    ← 대시보드
│       ├── blog/page.tsx               ← 블로그 목록 관리
│       ├── blog/new/page.tsx           ← 새 글 작성
│       ├── blog/edit/[slug]/page.tsx   ← 글 수정
│       ├── projects/page.tsx           ← 프로젝트 관리
│       ├── gallery/page.tsx            ← 갤러리 관리
│       └── settings/page.tsx          ← 설정
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── blog/route.ts
│   ├── projects/route.ts
│   ├── gallery/route.ts
│   └── settings/route.ts

components/
├── layout/
│   ├── NavBar.tsx      ← 스크롤 감지, 햄버거 메뉴, 다크모드, 언어 전환
│   ├── Footer.tsx      ← @foxibu → /admin/login
│   └── Sidebar.tsx     ← 프로필, 기술스택 배지, 최근 프로젝트
├── blog/
│   ├── BlogCard.tsx    ← Framer Motion hover, 태그 배지
│   └── Pagination.tsx  ← 이전/다음 + 페이지 번호
├── gallery/
│   └── GalleryGrid.tsx ← 카테고리 필터 + 이미지 모달
├── about/              ← (about 페이지 내 인라인 구현)
├── admin/
│   ├── AdminLayout.tsx     ← 사이드 네비, 로그아웃
│   ├── AdminBlogList.tsx   ← 글 목록 + 삭제 (client)
│   ├── AdminProjectManager.tsx ← 프로젝트 CRUD (client)
│   ├── AdminGalleryManager.tsx ← 이미지 업로드/삭제 (client)
│   ├── AdminSettingsForm.tsx   ← devMode 토글 + 프로필 편집 (client)
│   ├── BlogEditor.tsx      ← 제목/슬러그/태그 + TiptapEditor
│   └── TiptapEditor.tsx    ← WYSIWYG 에디터
└── ui/
    ├── Button.tsx      ← primary / secondary / danger
    ├── Badge.tsx       ← tag / skill 변형
    ├── Modal.tsx       ← Framer Motion, ESC 닫기
    ├── ThemeToggle.tsx ← 다크/라이트 전환
    └── LangToggle.tsx  ← 한국어/영어 전환

lib/
├── blog.ts      ← MDX 파일 CRUD
├── projects.ts  ← projects.json CRUD
├── gallery.ts   ← 이미지 파일 저장 + gallery.json
└── settings.ts  ← settings.json 읽기/쓰기

types/index.ts   ← BlogPost, Project, GalleryImage, SiteSettings
middleware.ts    ← next-intl + 관리자 인증 + devMode 차단
```

## 주요 기술 적용

| 기능 | 구현 방식 |
|------|----------|
| 다크모드 | `darkMode: 'class'` + ThemeToggle + localStorage |
| 다국어 | next-intl, [locale] 라우팅, ko.json/en.json |
| 애니메이션 | Framer Motion (BlogCard hover, Modal, 페이지 진입) |
| 에디터 | Tiptap StarterKit + Underline + Link + Image + Table |
| MDX 렌더링 | next-mdx-remote/rsc |
| 파일 업로드 | FormData API → /api/gallery → 로컬 저장 |
| 인증 | NextAuth.js Credentials + JWT |
| devMode | settings.json → middleware.ts 방문자 차단 |
