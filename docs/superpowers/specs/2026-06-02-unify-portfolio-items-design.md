# 설계: 프로젝트·활동·수상 통합 ("이력 아이템" 모델)

- 날짜: 2026-06-02
- 상태: 승인됨 (설계), 구현 계획 대기

## 배경 / 문제

현재 About 페이지의 콘텐츠는 세 갈래로 나뉘어 있다.

- **프로젝트**: `content/projects.json` — 카드형(`name, description, skills[], github?, link?, thumbnail?, order`)
- **활동 / 수상**: `content/settings.json`의 `profile.activities[]`, `profile.awards[]` — `{ year, title, description? }`. About 우측 타임라인에 이미 함께 렌더된다.

문제: 관리 위치가 분산돼 있고(프로젝트 / 설정의 활동·수상), 프로젝트는 연도가 없어 타임라인에 못 올라간다. 사용자는 (1) 프로젝트도 연도 타임라인에 함께 보이고, (2) 한 곳에서 관리하고, (3) 구조를 단순화하길 원한다.

## 목표

- 프로젝트·활동·수상을 **단일 데이터 모델**로 통합한다.
- admin에서 **한 화면**으로 모두 관리한다.
- About에서 프로젝트는 **카드 섹션 + 타임라인 둘 다**에 노출한다.

## 비목표 (out of scope)

- 인증/세션, 블로그, 갤러리, 홈 스트립, SEO/메타 변경 없음.
- 썸네일 업로드 UX 변경 없음(기존 admin 업로드 그대로).

## 데이터 모델

`content/items.json` — 단일 배열.

```ts
interface PortfolioItem {
  id: string
  type: 'project' | 'activity' | 'award'
  year: string            // 전 항목 공통. 타임라인 정렬·표시에 사용
  title: string
  description?: string
  // project 전용
  skills?: string[]
  github?: string
  link?: string
  thumbnail?: string
  order?: number          // project 카드 정렬용(선택)
}
```

- 모든 항목은 `year` 보유(프로젝트도 연도 필요).
- `SiteSettings.profile`에서 `activities`, `awards` 제거.
- `content/projects.json` 폐기.

## lib

- **신규 `lib/items.ts`**: `content/items.json` read/write + CRUD(`getItems/createItem/updateItem/deleteItem`).
  - `getProjects()` = `type==='project'`, `order`(없으면 year desc) 정렬.
  - `getTimeline()` = 전체 항목, `year` desc 정렬.
- **삭제 `lib/projects.ts`**.
- **수정 `lib/settings.ts`**: 활동/수상 관련 제거(프로필 기본 정보만 유지).
- **수정 `types/index.ts`**: `PortfolioItem` 추가, `Activity` 정리, `SiteSettings.profile`에서 activities/awards 제거.

## 관리자(admin)

- **신규 `/admin/items` "이력 관리"** + `components/admin/AdminItemManager.tsx`:
  - 항목 리스트(추가/수정/삭제), `type` 선택(프로젝트/활동/수상).
  - `type==='project'`일 때만 기술스택·GitHub·링크·썸네일 필드 노출. 전 항목 `year` 입력.
- **삭제**: `components/admin/AdminProjectManager.tsx`, `AdminSettingsForm`의 활동/수상 섹션.
- **수정 `AdminLayout`**: 네비를 "프로젝트" + (설정의 활동/수상) → "이력" 단일 항목으로.
- **API**: 신규 `/api/items`(GET/POST/PUT/DELETE). `/api/projects` 삭제. `/api/settings`에서 활동/수상 제거.

## About 렌더링 (`app/(site)/about/page.tsx`)

- **프로젝트 섹션**: `getProjects()` → 카드(현행 동일: 기술스택·링크·썸네일).
- **활동 & 수상 타임라인(우측 aside)**: `getTimeline()`(전체) → 연도순 타임라인. 각 줄에 type 뱃지(프로젝트/활동/수상). 프로젝트는 카드+타임라인 양쪽 노출.
- **`components/about/TimelineItem.tsx`**: `type`에 `'프로젝트'` 추가, 뱃지 색 구분.

## 마이그레이션

- 코드 배포와 별개로 `content/items.json`을 1회 생성(볼륨 데이터).
- 기존 → 신규 이관:
  - `projects.json` 3개 → `type:'project'`(연도는 작성 양식으로 채움).
  - 수상 1개(제5회 미래와 소프트웨어 공모전, 2025) → `type:'award'`.
  - 활동 현재 없음.
- `getItems()`는 파일 없으면 `[]` 반환(현행 lib 패턴과 동일하게 graceful).

## 위험 / 주의

- admin API 경로 변경(`/api/projects`→`/api/items`)에 맞춰 admin 컴포넌트 fetch 경로 동기화 필요.
- 배포는 Docker 재빌드 필요(코드 변경). content/items.json은 런타임 읽기라 즉시 반영.
- 타임라인은 현재 `hidden lg:block`(데스크톱 전용) — 모바일은 카드 섹션으로 커버.
