# 포트폴리오 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 포트폴리오를 Minimal Mistakes 스타일 기반의 모노톤 다크모드 디자인으로 전면 재설계한다.

**Architecture:** next-intl을 완전 제거하고 `app/[locale]/` 라우팅을 `app/`으로 단순화한다. 왼쪽 고정 사이드바 + 구분선 블로그 리스트로 레이아웃을 재구성하고, 모노톤 CSS 변수 기반 다크모드를 기본값으로 설정한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, NextAuth.js, next-mdx-remote, remark-math, rehype-katex

---

## 파일 구조 변경 요약

| 작업 | 파일 |
|------|------|
| 삭제 | `app/[locale]/` 전체, `messages/`, `i18n.ts`, `components/ui/LangToggle.tsx` |
| 재생성 | `app/layout.tsx`, `app/page.tsx`, `app/blog/[slug]/page.tsx`, `app/about/page.tsx`, `app/gallery/page.tsx`, `app/admin/**/*.tsx` |
| 수정 | `next.config.mjs`, `middleware.ts`, `components/layout/NavBar.tsx`, `components/layout/Sidebar.tsx`, `components/ui/ThemeToggle.tsx`, `components/admin/AdminLayout.tsx`, `app/globals.css` |
| 신규 | `components/blog/BlogListItem.tsx`, `lib/categories.ts`, `content/categories.json`, `app/admin/categories/page.tsx`, `components/admin/AdminCategoryManager.tsx` |

---

## Task 1: i18n 제거 + next.config.mjs 업데이트

**Files:**
- Modify: `next.config.mjs`
- Delete: `i18n.ts` (if exists)

- [ ] **Step 1: i18n.ts 삭제**

```bash
# i18n.ts가 있으면 삭제
rm -f i18n.ts
```

- [ ] **Step 2: next.config.mjs에서 next-intl 제거**

`next.config.mjs` 전체를 아래로 교체:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
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
```

- [ ] **Step 3: next-intl 패키지 제거**

```bash
npm uninstall next-intl
```

- [ ] **Step 4: messages 디렉토리 삭제**

```bash
rm -rf messages/
```

- [ ] **Step 5: LangToggle 컴포넌트 삭제**

```bash
rm -f components/ui/LangToggle.tsx
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove next-intl and i18n infrastructure"
```

---

## Task 2: middleware.ts 재작성

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: middleware.ts 전체 교체**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 관리자 경로 인증 보호 (로그인 페이지 제외)
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // devMode 방문자 차단
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    try {
      const settingsPath = `${process.cwd()}/content/settings.json`
      const { readFileSync, existsSync } = await import('fs')
      if (existsSync(settingsPath)) {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
        if (settings.devMode) {
          const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
          if (!token) {
            return NextResponse.rewrite(new URL('/admin/login', req.url))
          }
        }
      }
    } catch {
      // settings 읽기 실패 시 정상 진행
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "refactor: rewrite middleware without i18n"
```

---

## Task 3: app/layout.tsx 재작성 (다크모드 기본값)

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: app/layout.tsx 전체 교체**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  title: '포트폴리오',
  description: '개발자 포트폴리오',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme')
                if (theme === 'light') {
                  // 명시적으로 라이트를 선택한 경우만 라이트
                } else {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {
                document.documentElement.classList.add('dark')
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: katex 패키지 설치**

```bash
npm install remark-math rehype-katex katex
npm install --save-dev @types/katex
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx package.json package-lock.json
git commit -m "feat: add dark mode default and katex CSS"
```

---

## Task 4: globals.css 색상 업데이트

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: globals.css 색상 변수 섹션 교체**

`:root` 와 `.dark` 블록을 아래로 교체 (나머지 코드 유지):

```css
:root {
  --color-bg:             #ffffff;
  --color-bg-secondary:   #fafafa;
  --color-surface:        #f5f5f5;
  --color-border:         #e5e5e5;
  --color-text-primary:   #171717;
  --color-text-secondary: #737373;
  --color-text-muted:     #a3a3a3;
}

.dark {
  --color-bg:             #0a0a0a;
  --color-bg-secondary:   #141414;
  --color-surface:        #1f1f1f;
  --color-border:         #262626;
  --color-text-primary:   #ededed;
  --color-text-secondary: #a3a3a3;
  --color-text-muted:     #525252;
}
```

- [ ] **Step 2: tailwind.config.ts에서 primary 색상 제거, surface 추가**

`tailwind.config.ts`의 `colors` 섹션을 아래로 교체:

```ts
colors: {
  bg: {
    DEFAULT:   'var(--color-bg)',
    secondary: 'var(--color-bg-secondary)',
  },
  surface: 'var(--color-surface)',
  border: 'var(--color-border)',
  'text-primary':   'var(--color-text-primary)',
  'text-secondary': 'var(--color-text-secondary)',
  'text-muted':     'var(--color-text-muted)',
},
```

- [ ] **Step 3: globals.css에서 primary 색상 참조 제거**

`globals.css`에서 아래 행 제거:
```
--color-primary:        #18181B;
--color-primary-hover:  #27272A;
--color-primary-light:  #F4F4F5;
```
그리고 `.prose blockquote`의 `border-left`를 아래로 변경:
```css
.prose blockquote {
  border-left: 4px solid var(--color-border);
  color: var(--color-text-secondary);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat: update color system to monotone theme"
```

---

## Task 5: ThemeToggle → 슬라이드 스위치

**Files:**
- Modify: `components/ui/ThemeToggle.tsx`

- [ ] **Step 1: ThemeToggle 전체 교체**

```tsx
'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={toggle}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-muted ${
        isDark ? 'bg-surface border border-border' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${
          isDark
            ? 'translate-x-5 bg-text-primary'
            : 'translate-x-0.5 bg-text-primary'
        }`}
      />
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/ThemeToggle.tsx
git commit -m "feat: replace emoji toggle with slide switch"
```

---

## Task 6: NavBar 재설계

**Files:**
- Modify: `components/layout/NavBar.tsx`

- [ ] **Step 1: NavBar 전체 교체**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navLinks = [
  { href: '/', label: '블로그' },
  { href: '/about', label: '소개' },
  { href: '/gallery', label: '갤러리' },
]

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-bg border-b border-border">
      <nav className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <Link
          href="/"
          className="font-bold text-base text-text-primary hover:text-text-secondary transition-colors"
        >
          foxibu
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-bg px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/NavBar.tsx
git commit -m "feat: redesign NavBar - remove i18n, remove scroll effect"
```

---

## Task 7: Sidebar 단순화

**Files:**
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Sidebar 전체 교체**

```tsx
import type { SiteSettings } from '@/types'

interface SidebarProps {
  settings: SiteSettings
}

export default function Sidebar({ settings }: SidebarProps) {
  const { profile } = settings
  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-surface overflow-hidden border border-border">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-text-muted">
                👤
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-text-primary">{profile.name}</p>
            <p className="text-sm text-text-secondary mt-0.5">{profile.bio}</p>
          </div>
          <div className="flex gap-4 text-xs text-text-muted">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: simplify Sidebar - photo, name, bio, social links only"
```

---

## Task 8: BlogListItem 생성 + 메인 페이지 재작성

**Files:**
- Create: `components/blog/BlogListItem.tsx`
- Modify: `app/page.tsx`
- Delete: `components/blog/BlogCard.tsx`

- [ ] **Step 1: BlogListItem 생성**

`components/blog/BlogListItem.tsx`:

```tsx
import Link from 'next/link'
import type { BlogPost } from '@/types'

interface BlogListItemProps {
  post: BlogPost
}

export default function BlogListItem({ post }: BlogListItemProps) {
  return (
    <article className="py-5 border-b border-border last:border-b-0">
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-base font-semibold text-text-primary hover:underline mb-1.5">
          {post.title}
        </h2>
      </Link>
      <p className="text-xs text-text-muted mb-2">
        {post.date} · {post.readingTime}분 읽기
      </p>
      <p className="text-sm text-text-secondary line-clamp-2">{post.excerpt}</p>
    </article>
  )
}
```

- [ ] **Step 2: app/page.tsx 재작성**

`app/page.tsx` 전체 교체:

```tsx
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import BlogListItem from '@/components/blog/BlogListItem'
import Pagination from '@/components/blog/Pagination'
import { getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'

const POSTS_PER_PAGE = 10

interface Props {
  searchParams: { page?: string }
}

export default async function HomePage({ searchParams }: Props) {
  const posts = getAllPosts()
  const settings = getSettings()

  const currentPage = Number(searchParams.page ?? 1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const pagePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-12">
          <Sidebar settings={settings} />
          <div className="flex-1 min-w-0">
            {pagePosts.length === 0 ? (
              <p className="text-text-muted py-16 text-center text-sm">글이 없습니다.</p>
            ) : (
              <div>
                {pagePosts.map((post) => (
                  <BlogListItem key={post.slug} post={post} />
                ))}
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: BlogCard.tsx 삭제**

```bash
rm components/blog/BlogCard.tsx
```

- [ ] **Step 4: Pagination.tsx primary 색상 교체**

`components/blog/Pagination.tsx`에서 active 버튼 클래스 변경:

```tsx
// 변경 전
'bg-primary text-white border-primary'
// 변경 후
'bg-text-primary text-bg border-text-primary'
```

hover 색상도 변경:
```tsx
// 변경 전
'hover:text-primary hover:border-primary'
// 변경 후
'hover:text-text-primary hover:border-text-muted'
```

전체 Pagination.tsx 관련 클래스 적용 결과:
```tsx
className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
  page === currentPage
    ? 'bg-text-primary text-bg border-text-primary'
    : 'border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
}`}
```
이전/다음 링크도 `hover:text-primary` → `hover:text-text-primary` 로 변경.

- [ ] **Step 5: 모바일용 프로필 한 줄 추가**

`app/page.tsx`에서 `<main>` 안 flex 컨테이너 바로 위에 모바일 전용 프로필 한 줄 추가:

```tsx
{/* 모바일: Sidebar 대신 이름 + 소개 한 줄 */}
<div className="lg:hidden mb-6 pb-6 border-b border-border">
  <p className="text-sm font-semibold text-text-primary">{settings.profile.name}</p>
  <p className="text-xs text-text-secondary mt-0.5">{settings.profile.bio}</p>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: replace BlogCard with BlogListItem, rewrite main page"
```

---

## Task 9: app/[locale]/ → app/ 라우팅 재구성

**Files:**
- Delete: `app/[locale]/` 전체
- Create: `app/blog/[slug]/page.tsx`, `app/about/page.tsx`, `app/gallery/page.tsx`, `app/admin/**`

- [ ] **Step 1: 기존 locale 하위 파일 내용 복사용으로 읽기**

아래 파일들을 복사하여 locale 제거 버전으로 재작성한다:
- `app/[locale]/blog/[slug]/page.tsx` → `app/blog/[slug]/page.tsx`
- `app/[locale]/about/page.tsx` → `app/about/page.tsx`
- `app/[locale]/gallery/page.tsx` → `app/gallery/page.tsx`
- `app/[locale]/admin/` → `app/admin/`

- [ ] **Step 2: app/blog/[slug]/page.tsx 생성**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params: { slug } }: Props) {
  const post = getPostBySlug(slug)
  if (!post || post.status !== 'published') notFound()

  const settings = getSettings()
  const allPosts = getAllPosts()
  const idx = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const nextPost = idx > 0 ? allPosts[idx - 1] : null

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-12">
          <Sidebar settings={settings} />
          <article className="flex-1 min-w-0">
            <header className="mb-8 pb-6 border-b border-border">
              <h1 className="text-2xl font-bold text-text-primary mb-3">{post.title}</h1>
              <p className="text-sm text-text-muted">
                {post.date} · {post.readingTime}분 읽기
              </p>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                  },
                }}
              />
            </div>

            <div className="mt-12 pt-8 border-t border-border flex justify-between gap-4">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="flex-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← {prevPost.title}
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="flex-1 text-right text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {nextPost.title} →
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: 블로그 방문 시 조회수 increment용 컴포넌트 생성**

`components/blog/ViewIncrementer.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export default function ViewIncrementer({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])
  return null
}
```

`app/blog/[slug]/page.tsx`에 `<ViewIncrementer slug={slug} />`를 `<article>` 시작 직후에 추가:

```tsx
import ViewIncrementer from '@/components/blog/ViewIncrementer'

// article 내부 첫 줄:
<ViewIncrementer slug={slug} />
```

- [ ] **Step 4: app/about/page.tsx 생성**

기존 `app/[locale]/about/page.tsx`를 복사하되 `locale` 파라미터 제거, 링크에서 `/${locale}/` 제거:

```tsx
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import { getSettings } from '@/lib/settings'
import { getProjects } from '@/lib/projects'
import Link from 'next/link'

export default async function AboutPage() {
  const settings = getSettings()
  const projects = getProjects()
  const { profile } = settings

  const avatarSrc =
    profile.avatar ||
    (profile.github
      ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}`
      : '')

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        {/* 프로필 */}
        <section className="flex gap-8 items-start mb-12 pb-12 border-b border-border">
          <div className="w-24 h-24 rounded-full bg-surface border border-border overflow-hidden shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-text-muted">👤</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{profile.name}</h1>
            <p className="text-text-secondary mb-4 whitespace-pre-line">{profile.aboutText || profile.bio}</p>
            <div className="flex gap-4 text-sm text-text-muted">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="hover:text-text-primary transition-colors">GitHub</a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="hover:text-text-primary transition-colors">LinkedIn</a>
              )}
            </div>
          </div>
        </section>

        {/* 프로젝트 */}
        {projects.length > 0 && (
          <section className="mb-12 pb-12 border-b border-border">
            <h2 className="text-lg font-bold text-text-primary mb-6">프로젝트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <div key={project.id}
                  className="border border-border rounded-lg p-5 bg-bg-secondary">
                  {project.thumbnail && (
                    <img src={project.thumbnail} alt={project.name}
                      className="w-full h-36 object-cover rounded-md mb-4 bg-surface" />
                  )}
                  <h3 className="font-semibold text-text-primary mb-1">{project.name}</h3>
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.skills.map((s) => (
                      <span key={s}
                        className="text-xs px-2 py-0.5 rounded bg-surface text-text-muted">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-text-muted">
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer"
                        className="hover:text-text-primary transition-colors">GitHub</a>
                    )}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer"
                        className="hover:text-text-primary transition-colors">링크 →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 활동 & 수상 */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {profile.activities.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">활동</h2>
                <ul className="flex flex-col gap-3">
                  {profile.activities.map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-text-muted mr-2">{item.year}</span>
                      <span className="text-text-primary">{item.title}</span>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-0.5 ml-8">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.awards.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">수상</h2>
                <ul className="flex flex-col gap-3">
                  {profile.awards.map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-text-muted mr-2">{item.year}</span>
                      <span className="text-text-primary">{item.title}</span>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-0.5 ml-8">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5: app/gallery/page.tsx 생성**

기존 `app/[locale]/gallery/page.tsx`에서 `locale` 파라미터 제거하여 재생성:

```tsx
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/gallery'

export default async function GalleryPage() {
  const images = getGalleryImages()
  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-6">갤러리</h1>
        <GalleryGrid images={images} />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6: app/admin/login/page.tsx 재생성**

`app/admin/login/page.tsx` 전체 (useLocale 제거, redirect 경로 수정):

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push('/admin')
    } else {
      setError('비밀번호가 틀렸습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Admin</p>
          <h1 className="text-xl font-semibold text-text-primary">로그인</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border rounded-lg p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs text-text-muted mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors"
              placeholder="비밀번호 입력"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6b: 나머지 admin 파일들 재생성**

아래 파일들을 `app/[locale]/admin/` 에서 `app/admin/`으로 복사하며 공통 변환 적용:
- `params: { locale: string }` 파라미터 제거
- `redirect('/admin/login')` (locale 없이)
- 링크 href에서 `/${locale}` 제거 (`/admin/blog` 형태로)

대상: `app/admin/blog/page.tsx`, `app/admin/blog/new/page.tsx`, `app/admin/blog/edit/[slug]/page.tsx`, `app/admin/projects/page.tsx`, `app/admin/gallery/page.tsx`, `app/admin/settings/page.tsx`

- [ ] **Step 7: app/[locale]/ 디렉토리 삭제**

```bash
rm -rf "app/[locale]"
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: flatten routing - remove [locale] segment from all pages"
```

---

## Task 10: AdminLayout + AdminSettingsForm i18n 제거

**Files:**
- Modify: `components/admin/AdminLayout.tsx`
- Modify: `components/admin/AdminSettingsForm.tsx` (signOut callbackUrl)

- [ ] **Step 1: AdminLayout 전체 교체**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/blog', label: '블로그' },
  { href: '/admin/projects', label: '프로젝트' },
  { href: '/admin/gallery', label: '갤러리' },
  { href: '/admin/categories', label: '카테고리' },
  { href: '/admin/settings', label: '설정' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <nav className="w-48 shrink-0 bg-bg-secondary border-r border-border flex flex-col">
        <div className="px-4 h-12 flex items-center border-b border-border">
          <span className="text-sm font-semibold text-text-primary">Admin</span>
        </div>

        <ul className="flex-1 py-2 px-2 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-surface text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="px-2 pb-3">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center px-2.5 py-1.5 rounded-md text-sm text-text-muted hover:text-red-500 hover:bg-surface transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: AdminSettingsForm의 /api/upload 확인**

`AdminSettingsForm.tsx`에서 `fetch('/api/upload', ...)` 호출이 그대로 유지되는지 확인. `api/upload/route.ts`가 이미 존재하므로 추가 작업 없음.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminLayout.tsx
git commit -m "refactor: remove next-intl from AdminLayout, add categories nav"
```

---

## Task 11: 관리자 대시보드 조회수 추가

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: app/admin/page.tsx에서 조회수 import 추가 및 표시**

기존 파일에서 `getAllViews` import 추가:

```tsx
import { getAllViews } from '@/lib/views'
```

`recentPosts` 아래에 views 데이터 추가:

```tsx
const allViews = getAllViews()
```

최근 글 목록 렌더링 부분에서 날짜 옆에 조회수 추가:

```tsx
<p className="text-xs text-text-muted mt-0.5">
  {post.date}
  {(allViews[post.slug] ?? 0) > 0 && (
    <span className="ml-2 text-text-muted">· {allViews[post.slug].toLocaleString()} views</span>
  )}
</p>
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: show view counts in admin dashboard"
```

---

## Task 12: types에 category 추가 + lib/categories.ts 생성

**Files:**
- Modify: `types/index.ts`
- Create: `lib/categories.ts`
- Create: `content/categories.json`

- [ ] **Step 1: BlogPost 타입에 category 추가**

`types/index.ts`에서 `BlogPost` 인터페이스에 추가:

```ts
export interface BlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
  category?: string   // 추가
  excerpt: string
  content: string
  status: 'published' | 'draft'
  readingTime: number
}
```

- [ ] **Step 2: content/categories.json 생성**

```json
[]
```

- [ ] **Step 3: lib/categories.ts 생성**

```ts
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'content/categories.json')

function readCategories(): string[] {
  if (!fs.existsSync(FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeCategories(categories: string[]): void {
  fs.writeFileSync(FILE, JSON.stringify(categories, null, 2), 'utf-8')
}

export function getCategories(): string[] {
  return readCategories()
}

export function addCategory(name: string): string[] {
  const categories = readCategories()
  const trimmed = name.trim()
  if (trimmed && !categories.includes(trimmed)) {
    categories.push(trimmed)
    writeCategories(categories)
  }
  return categories
}

export function deleteCategory(name: string): string[] {
  const categories = readCategories().filter((c) => c !== name)
  writeCategories(categories)
  return categories
}
```

- [ ] **Step 4: lib/blog.ts에서 category 필드 파싱 추가**

`getAllPosts`, `getPostBySlug`, `getAllPostsAdmin`, `createPost`, `updatePost` 에서 `category` 필드 처리 추가:

파싱 시:
```ts
category: data.category ?? undefined,
```

`createPost`/`updatePost`의 frontmatter 객체에:
```ts
...(post.category ? { category: post.category } : {}),
```

- [ ] **Step 5: Commit**

```bash
git add types/index.ts lib/categories.ts content/categories.json lib/blog.ts
git commit -m "feat: add category field to BlogPost and categories lib"
```

---

## Task 13: 카테고리 관리 API + 관리자 페이지

**Files:**
- Create: `app/api/categories/route.ts`
- Create: `components/admin/AdminCategoryManager.tsx`
- Create: `app/admin/categories/page.tsx`

- [ ] **Step 1: app/api/categories/route.ts 생성**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCategories, addCategory, deleteCategory } from '@/lib/categories'

export async function GET() {
  return NextResponse.json(getCategories())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  return NextResponse.json(addCategory(name))
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  return NextResponse.json(deleteCategory(name))
}
```

- [ ] **Step 2: components/admin/AdminCategoryManager.tsx 생성**

```tsx
'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface AdminCategoryManagerProps {
  initialCategories: string[]
}

export default function AdminCategoryManager({ initialCategories }: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCategories(updated)
      setInput('')
    }
    setSaving(false)
  }

  async function handleDelete(name: string) {
    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCategories(updated)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-text-primary mb-7">카테고리 관리</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="카테고리 이름"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors"
        />
        <Button onClick={handleAdd} disabled={saving || !input.trim()}>
          추가
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-text-muted">카테고리가 없습니다.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-bg-secondary">
          {categories.map((cat, i) => (
            <div
              key={cat}
              className={`flex items-center justify-between px-4 py-3 ${
                i < categories.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span className="text-sm text-text-primary">{cat}</span>
              <button
                onClick={() => handleDelete(cat)}
                className="text-xs text-text-muted hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: app/admin/categories/page.tsx 생성**

```tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminCategoryManager from '@/components/admin/AdminCategoryManager'
import { getCategories } from '@/lib/categories'

export default async function AdminCategoriesPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const categories = getCategories()
  return (
    <AdminLayout>
      <AdminCategoryManager initialCategories={categories} />
    </AdminLayout>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/categories/route.ts components/admin/AdminCategoryManager.tsx app/admin/categories/page.tsx
git commit -m "feat: add category management (API + admin page)"
```

---

## Task 14: 블로그 에디터에 카테고리 선택 추가

**Files:**
- Modify: `components/admin/BlogEditor.tsx`

- [ ] **Step 1: BlogEditor에 categories props 추가 및 선택 UI 삽입**

`components/admin/BlogEditor.tsx`에서 props 타입에 categories 추가:

```tsx
interface BlogEditorProps {
  initialPost?: Partial<BlogPost>
  categories: string[]  // 추가
}
```

컴포넌트 내부 state에 category 추가:

```tsx
const [category, setCategory] = useState(initialPost?.category ?? '')
```

제출 데이터에 category 추가:

```tsx
body: JSON.stringify({ ...postData, category }),
```

태그 입력 아래에 카테고리 선택 추가:

```tsx
<div>
  <label className="block text-xs text-text-muted mb-1">카테고리</label>
  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-text-muted transition-colors"
  >
    <option value="">카테고리 없음</option>
    {categories.map((cat) => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 2: 블로그 new/edit 페이지에서 categories 전달**

`app/admin/blog/new/page.tsx`에서:

```tsx
import { getCategories } from '@/lib/categories'
// ...
const categories = getCategories()
// <BlogEditor categories={categories} />
```

`app/admin/blog/edit/[slug]/page.tsx`에서도 동일하게.

- [ ] **Step 3: Commit**

```bash
git add components/admin/BlogEditor.tsx app/admin/blog/new/page.tsx app/admin/blog/edit/[slug]/page.tsx
git commit -m "feat: add category selector to blog editor"
```

---

## Task 15: 빌드 검증

- [ ] **Step 1: TypeScript 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음. `text-primary`/`text-secondary` 등 tailwind 클래스 관련 타입 에러는 무시.

- [ ] **Step 2: 빌드 실행**

```bash
npm run build
```

Expected: 빌드 성공. `next-intl` 관련 import 에러가 있다면 해당 파일을 찾아 제거.

- [ ] **Step 3: 개발 서버 실행 후 수동 확인**

```bash
npm run dev
```

확인 항목:
- `http://localhost:3000` — 메인 페이지 (왼쪽 사이드바 + 리스트형 블로그)
- `http://localhost:3000/blog/[slug]` — 블로그 상세 (수식 렌더링 확인)
- `http://localhost:3000/about` — 소개 페이지
- `http://localhost:3000/gallery` — 갤러리
- `http://localhost:3000/admin` — 관리자 대시보드 (조회수 표시)
- `http://localhost:3000/admin/categories` — 카테고리 관리
- 다크모드 기본값 확인
- 슬라이드 토글 동작 확인

- [ ] **Step 4: 최종 Commit**

```bash
git add -A
git commit -m "feat: complete portfolio redesign - monotone dark theme, Minimal Mistakes layout"
```
