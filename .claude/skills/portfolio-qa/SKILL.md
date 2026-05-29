---
name: portfolio-qa
description: 포트폴리오 웹사이트 품질을 검증하는 스킬. 와이어프레임·디자인 스펙과 실제 구현 간의 경계면을 교차 비교하고, 타입 정합성·접근성·반응형 레이아웃·API 연결을 점검한다. "QA", "품질 검증", "버그 찾아줘", "스펙 맞는지 확인", "테스트해줘", "빌드 검증" 요청 시 반드시 이 스킬을 사용할 것.
---

## QA 철학
"파일이 존재하는가"가 아니라 **"경계면이 올바르게 연결되었는가"**를 검증한다.

예:
- API 응답 `{ name, email, message }` ↔ 프론트 타입 `ContactFormData` shape 비교
- 디자인 시스템의 `--color-accent` ↔ 실제 globals.css 변수 존재 여부
- 와이어프레임 컴포넌트 목록 ↔ `src/components/` 실제 파일 목록

## 실행 단계

### 1. 스펙 파일 수집
다음을 모두 읽는다:
- `_workspace/01_wireframer_wireframes.md`
- `_workspace/02_designer_design-system.md`
- `_workspace/03_frontend-dev_component-list.md`
- `_workspace/04_backend-dev_api-spec.md` (존재 시)

### 2. 구현 파일 수집
```
src/components/ — 컴포넌트 파일 목록
src/app/globals.css — CSS Variables 확인
tailwind.config.js — Tailwind 설정 확인
src/types/index.ts — 타입 정의 확인
src/app/api/ — API Routes 확인
```

### 3. 경계면 교차 비교

**컴포넌트 완성도:**
와이어프레임의 컴포넌트 목록 vs `src/components/` 파일 목록 → 누락된 컴포넌트 식별

**디자인 토큰 적용:**
`_workspace/02_designer_design-system.md`의 CSS Variables 목록 vs `globals.css` 실제 변수 → 미적용 토큰 식별

**API 타입 정합성:**
`_workspace/04_backend-dev_api-spec.md`의 요청/응답 shape vs `src/types/index.ts` 타입 → 불일치 식별

**접근성:**
`src/components/sections/`의 모든 파일에서:
- `<img>` / `<Image>` 태그의 `alt` 속성 누락
- `<input>` / `<textarea>`에 `<label>` 연결 (id-for 쌍)
- 버튼에 `aria-label` 또는 텍스트 콘텐츠

### 4. 빌드 검증
```bash
npm run build      # 빌드 에러 확인
npx tsc --noEmit   # 타입 에러 확인
```

### 5. 반응형 검증
`src/components/`에서 Tailwind 반응형 클래스 사용 패턴:
- NavBar: `md:hidden`, `hidden md:flex` 패턴 존재 여부
- 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` 패턴 존재 여부

## Severity 분류 기준
| Level | 기준 | 예시 |
|-------|------|------|
| Critical | 빌드 실패, 런타임 크래시 | TypeScript 에러, missing export |
| High | 기능 불동작 | 연락 폼 제출 안 됨, 이미지 404 |
| Medium | 스펙 불일치 | 디자인 토큰 미적용, 컴포넌트 레이아웃 차이 |
| Low | 개선 권장 | alt 텍스트 불충분, 애니메이션 타이밍 미세 조정 |

## 출력 형식
`_workspace/05_qa-engineer_bug-report.md`:

```markdown
# QA 버그 리포트

## 요약
- Critical: N개
- High: N개  
- Medium: N개
- Low: N개
- QA 통과 여부: Critical + High = 0이면 통과

## 발견 항목
| ID | Severity | 위치 | 설명 | 권고사항 |
|----|----------|------|------|----------|
| QA-001 | High | src/components/ContactForm.tsx | ... | ... |

## 스펙 vs 구현 비교표
| 스펙 항목 | 스펙 값 | 구현 값 | 일치 여부 |
|---------|---------|---------|----------|

## 빌드 결과
- npm run build: ✅ / ❌
- tsc --noEmit: ✅ / ❌
```
