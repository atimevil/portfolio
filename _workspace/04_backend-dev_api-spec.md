# API 스펙

## 인증

`/api/auth/[...nextauth]` — NextAuth.js Credentials Provider
- POST: `{ password }` → JWT 세션 발급
- GET: 세션 조회

모든 관리자 API는 `getServerSession()` 세션 검증 필요. 미인증 시 `401 Unauthorized`.

---

## `/api/blog`

| Method | Body | 응답 | 권한 |
|--------|------|------|------|
| GET | — | `BlogPost[]` (전체, draft 포함) | 인증 필요 |
| POST | `BlogPost` (slug, title, date, tags, excerpt, content, status) | `{ ok: true }` | 인증 필요 |
| PUT | `{ slug, ...updates }` | `{ ok: true }` | 인증 필요 |
| DELETE | `{ slug }` | `{ ok: true }` | 인증 필요 |

파일 저장 경로: `content/posts/{slug}.mdx`

---

## `/api/projects`

| Method | Body | 응답 | 권한 |
|--------|------|------|------|
| GET | — | `Project[]` | 공개 |
| POST | `{ name, description, skills, github?, link?, thumbnail?, order }` | `Project` | 인증 필요 |
| PUT | `{ id, ...updates }` | `{ ok: true }` | 인증 필요 |
| DELETE | `{ id }` | `{ ok: true }` | 인증 필요 |

파일 저장 경로: `content/projects.json`

---

## `/api/gallery`

| Method | Body | 응답 | 권한 |
|--------|------|------|------|
| GET | — | `GalleryImage[]` | 공개 |
| POST | FormData: `file`, `category`, `description` | `GalleryImage` | 인증 필요 |
| DELETE | `{ id }` | `{ ok: true }` | 인증 필요 |

이미지 저장 경로: `public/uploads/gallery/{id}{ext}`
메타데이터: `content/gallery.json`

---

## `/api/settings`

| Method | Body | 응답 | 권한 |
|--------|------|------|------|
| GET | — | `SiteSettings` | 공개 |
| PUT | `Partial<SiteSettings>` | `SiteSettings` | 인증 필요 |

파일 저장 경로: `content/settings.json`

---

## 공통 에러 응답

```json
{ "error": "Unauthorized" }     // 401
{ "error": "Bad Request" }      // 400
{ "error": "Not Found" }        // 404
{ "error": "Internal Error" }   // 500
```
