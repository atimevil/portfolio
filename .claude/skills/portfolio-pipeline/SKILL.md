---
name: portfolio-pipeline
description: 포트폴리오 웹사이트 개발 전체 파이프라인을 조율하는 오케스트레이터. 와이어프레임 → 디자인 시스템 → 프론트엔드/백엔드 → QA → 배포 순서로 에이전트 팀을 조율한다. "포트폴리오 만들어줘", "포트폴리오 개발 시작", "처음부터 만들어줘", "전체 파이프라인 돌려줘" 요청 시 반드시 이 스킬을 사용할 것. 또한 "와이어프레임 다시 해줘", "디자인 수정해줘", "QA 다시 돌려줘", "배포 설정만 해줘" 같은 부분 재실행 요청에도 이 스킬을 사용한다.
---

## 실행 모드
**에이전트 팀** (기본) — `TeamCreate`로 팀 구성, `TaskCreate`로 작업 할당, `SendMessage`로 팀원 간 조율.
Phase 5 (프론트엔드 + 백엔드)는 **병렬 실행** 가능.

---

## 확정 프로젝트 스펙

### 사이트 구조
| 경로 | 내용 |
|------|------|
| `/` | 블로그 글 목록 (메인) + 오른쪽 사이드바 |
| `/blog/[slug]` | 블로그 글 상세 |
| `/about` | 소개 전체 페이지 (프로젝트, 활동, 수상) |
| `/gallery` | 갤러리 |
| `/admin/login` | 관리자 로그인 (Footer @foxibu 클릭으로 진입) |
| `/admin` | 관리자 대시보드 |
| `/admin/blog` | 블로그 관리 (목록/작성/수정/삭제) |
| `/admin/projects` | 프로젝트 관리 |
| `/admin/gallery` | 갤러리 이미지 업로드/관리 |
| `/admin/settings` | 설정 (개발중 토글, 프로필 편집, 소개 편집) |

### 네비게이션 (상단 우측)
- 블로그 / 소개 / 갤러리
- 다크모드 토글 버튼
- 언어 전환 버튼 (한국어 / English)

### 사이드바 (메인 + 블로그 상세 페이지)
- 프로필 사진 + 이름 + 한 줄 소개
- 기술 스택
- 최근 프로젝트 (2-3개)

### Footer
- `© 2024 [이름] · @foxibu` — @foxibu 클릭 시 `/admin/login` 이동 (일반 텍스트, 숨기지 않음)

### 기능
- **다크모드**: Tailwind `darkMode: 'class'` + localStorage
- **다국어**: next-intl (한국어/영어), `messages/ko.json` + `messages/en.json`
- **개발중 토글**: `settings.json`의 `devMode: true` → middleware.ts에서 방문자 차단, 관리자 세션은 통과

### 기술 스택
- **프레임워크**: Next.js 14 App Router + TypeScript
- **스타일**: Tailwind CSS + Framer Motion
- **인증**: NextAuth.js Credentials (환경변수 비밀번호)
- **에디터**: Tiptap (Bold/Italic/이미지/코드블록/표 등 리치 기능)
- **다국어**: next-intl
- **배포**: Docker + Nginx reverse proxy (도메인 보유)

### 콘텐츠 저장 (파일시스템 기반, DB 없음)
```
content/                    ← Docker volume 마운트
├── posts/                  ← 블로그 MDX 파일
│   └── 2024-01-01-title.mdx
├── projects.json           ← 프로젝트 목록
├── gallery.json            ← 갤러리 메타데이터
└── settings.json           ← 사이트 설정 (devMode, 프로필 등)

public/uploads/             ← Docker volume 마운트
└── gallery/                ← 갤러리 이미지
└── projects/               ← 프로젝트 썸네일
```

---

## Phase 0: 컨텍스트 확인

`_workspace/` 디렉토리 존재 여부로 실행 모드를 결정한다:

```
_workspace/ 미존재
  → 초기 실행: Phase 1부터 전체 파이프라인 실행

_workspace/ 존재 + "X만 다시" 요청
  → 부분 재실행: 해당 에이전트만 재호출 (아래 빠른 재호출 가이드 참조)

_workspace/ 존재 + 완전히 새로운 요청
  → _workspace/를 _workspace_prev/로 이동 후 새 실행
```

**빠른 재호출 가이드:**
| 요청 | 재호출 에이전트 |
|------|----------------|
| 와이어프레임 수정 | wireframer |
| 디자인/색상 변경 | designer → frontend-dev (CSS 반영) |
| 컴포넌트 수정 | frontend-dev |
| API/파일 핸들러 수정 | backend-dev → qa-engineer |
| QA 재실행 | qa-engineer |
| 배포 설정 변경 | deploy-engineer |

---

## Phase 1: 요구사항 확인
이미 스펙이 확정되어 있으므로 위 "확정 프로젝트 스펙"을 참조한다.
추가 확인이 필요한 항목만 사용자에게 질문한다.

## Phase 2: 팀 구성

```
TeamCreate("portfolio-team", [
  "wireframer",
  "designer",
  "frontend-dev",
  "backend-dev",
  "qa-engineer",
  "deploy-engineer"
])
```

## Phase 3: 와이어프레임

```
TaskCreate({
  id: "task-wireframe",
  assignee: "wireframer",
  title: "포트폴리오 와이어프레임 설계",
  description: "
    wireframe-design 스킬을 사용한다.
    확정 스펙의 모든 페이지에 대한 와이어프레임을 생성한다:
    - 메인 (블로그 목록 + 오른쪽 사이드바)
    - 블로그 상세
    - 소개 페이지
    - 갤러리
    - 관리자 로그인
    - 관리자 대시보드 + 각 관리 페이지
    산출물: _workspace/01_wireframer_wireframes.md
    완료 후: designer에게 SendMessage
  ",
  depends_on: []
})
```

## Phase 4: 디자인 시스템

```
TaskCreate({
  id: "task-design",
  assignee: "designer",
  title: "디자인 시스템 구축",
  description: "
    ui-design-system 스킬을 사용한다.
    블로그 중심 레이아웃에 맞는 디자인 시스템 정의.
    다크모드 포함.
    산출물: _workspace/02_designer_design-system.md
    완료 후: frontend-dev에게 SendMessage
  ",
  depends_on: ["task-wireframe"]
})
```

## Phase 5: 프론트엔드 + 백엔드 병렬 개발

```
TaskCreate({
  id: "task-backend",
  assignee: "backend-dev",
  title: "파일시스템 기반 백엔드 구현",
  description: "
    backend-api 스킬을 사용한다.
    API 스펙 먼저 작성 → frontend-dev에게 SendMessage.
    구현 대상:
    - NextAuth.js Credentials 인증 (env 비밀번호)
    - /api/blog: MDX 파일 CRUD
    - /api/projects: projects.json CRUD
    - /api/gallery: 이미지 업로드/삭제 + gallery.json 관리
    - /api/settings: settings.json 읽기/쓰기
    - middleware.ts: devMode 체크 + 관리자 인증 보호
    산출물: src/app/api/, middleware.ts, .env.example,
            _workspace/04_backend-dev_api-spec.md
  ",
  depends_on: ["task-wireframe"]
})

TaskCreate({
  id: "task-frontend",
  assignee: "frontend-dev",
  title: "프론트엔드 구현",
  description: "
    frontend-build 스킬을 사용한다.
    구현 대상:
    - 레이아웃: NavBar (블로그/소개/갤러리 + 다크모드 + 언어토글) + Footer (@foxibu)
    - 사이드바: 프로필, 기술스택, 최근 프로젝트
    - 메인(/): 블로그 목록 + 사이드바
    - /blog/[slug]: 블로그 상세 + 사이드바
    - /about: 소개 전체 (프로젝트, 활동, 수상)
    - /gallery: 갤러리
    - /admin/*: 관리자 페이지 전체
    - next-intl i18n 적용 (ko/en)
    - Tiptap 에디터 (블로그 작성)
    산출물: src/ 전체, _workspace/03_frontend-dev_component-list.md
    완료 후: qa-engineer에게 SendMessage
  ",
  depends_on: ["task-design"]
})
```

## Phase 6: QA 검증

```
TaskCreate({
  id: "task-qa",
  assignee: "qa-engineer",
  title: "품질 검증",
  description: "
    portfolio-qa 스킬을 사용한다.
    추가 검증 항목:
    - 관리자 미인증 시 /admin/* 접근 차단 여부
    - devMode 토글 동작 (방문자 차단, 관리자 통과)
    - 언어 전환 시 모든 텍스트 번역 여부
    - 파일 업로드 API 동작 (이미지 저장 경로)
    - Footer @foxibu → /admin/login 이동
    산출물: _workspace/05_qa-engineer_bug-report.md
  ",
  depends_on: ["task-frontend", "task-backend"]
})
```

## Phase 7: 배포 설정

```
TaskCreate({
  id: "task-deploy",
  assignee: "deploy-engineer",
  title: "Docker 배포 구성",
  description: "
    deploy-pipeline 스킬을 사용한다.
    Docker 배포에 맞게 구성:
    - Dockerfile (multi-stage build)
    - docker-compose.yml (volume 마운트: content/, public/uploads/)
    - .github/workflows/ci.yml
    - Nginx 설정 예시
    - robots.txt, sitemap.ts
    산출물: Dockerfile, docker-compose.yml, nginx.conf,
            .github/workflows/ci.yml,
            _workspace/06_deploy-engineer_deploy-guide.md
  ",
  depends_on: ["task-qa"]
})
```

## Phase 8: 최종 보고

```markdown
## 포트폴리오 개발 완료

### 생성된 산출물
| 단계 | 파일 |
|------|------|
| 와이어프레임 | _workspace/01_wireframer_wireframes.md |
| 디자인 시스템 | _workspace/02_designer_design-system.md |
| 컴포넌트 목록 | _workspace/03_frontend-dev_component-list.md |
| API 스펙 | _workspace/04_backend-dev_api-spec.md |
| QA 리포트 | _workspace/05_qa-engineer_bug-report.md |
| 배포 가이드 | _workspace/06_deploy-engineer_deploy-guide.md |

### 다음 단계
1. _workspace/06_deploy-engineer_deploy-guide.md 확인
2. .env 파일 설정 (ADMIN_PASSWORD, NEXTAUTH_SECRET)
3. docker-compose up
```

## 에러 핸들링
- 에이전트 1회 실패 → 재시도. 재실패 시 해당 Phase 없이 진행 (보고서에 명시)
- QA Critical 버그 → 해당 에이전트 수정 루프 (최대 3회)
- 빌드 실패 → deploy-engineer가 에러를 frontend-dev에 전달

## 테스트 시나리오

### 정상 흐름
```
입력: "개발 시작해줘"
기대: Phase 0~8 순서 실행, 모든 페이지 및 관리자 패널 구현 완료
```

### 부분 재실행
```
"색상 바꿔줘" → designer + frontend-dev
"관리자 페이지 수정" → frontend-dev (admin 부분)
"Docker 설정 다시" → deploy-engineer
```
