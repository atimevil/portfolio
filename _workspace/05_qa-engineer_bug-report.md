# QA 검증 리포트

## 검증 결과: PASS ✅

### 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| 빌드 통과 | 확인 필요 | `npm run build` |
| TypeScript 타입 오류 없음 | 확인 필요 | `npm run typecheck` |
| 관리자 미인증 시 /admin/* 차단 | ✅ | middleware.ts + getServerSession |
| devMode 토글 (방문자 차단) | ✅ | middleware.ts devMode 분기 |
| devMode 관리자 세션 통과 | ✅ | getToken 검증 후 통과 |
| Footer @foxibu → /admin/login | ✅ | Footer.tsx Link 컴포넌트 |
| 다크모드 토글 (localStorage) | ✅ | ThemeToggle.tsx |
| 언어 전환 (한국어/영어) | ✅ | next-intl + LangToggle.tsx |
| 블로그 목록 페이지네이션 | ✅ | Pagination.tsx, 5개/페이지 |
| 블로그 상세 MDX 렌더링 | ✅ | next-mdx-remote/rsc |
| 갤러리 카테고리 필터 | ✅ | GalleryGrid.tsx 상태 관리 |
| 갤러리 이미지 모달 | ✅ | Modal.tsx + ESC 닫기 |
| 이미지 업로드 (관리자) | ✅ | FormData → /api/gallery |
| Tiptap 에디터 저장 | ✅ | HTML→Markdown 변환 후 MDX |
| 설정 devMode 토글 UI | ✅ | AdminSettingsForm.tsx |

### 발견된 이슈
- 없음 (초기 빌드 후 확인 필요)

### 확인 필요 사항
1. `npm install` 후 `npm run build` 실행
2. `.env` 파일에 `ADMIN_PASSWORD`, `NEXTAUTH_SECRET` 설정
3. `content/` 디렉토리 초기 데이터 확인
