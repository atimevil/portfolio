// content/items.json의 프로젝트 GitHub 스타·포크를 받아 content/github-stats.json에 저장한다.
// 하루 한 번 서버(호스트)에서 맨 node로 돈다 — 앱 컨테이너(standalone 빌드)엔 tsx·개발
// 의존성이 없어서다. content/는 호스트와 컨테이너가 공유하는 볼륨이라, 여기 쓰면 앱이 바로 본다.
//
//   node scripts/fetch-github-stats.mjs
//
// 의존성 0(Node 18+ 내장 fetch만). GITHUB_TOKEN이 있으면 rate limit을 올린다(없어도 동작).
// 실패한 레포는 건너뛰고 기존 값을 유지한다 — GitHub이 죽어도 파일을 망가뜨리지 않는다.
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'content/github-stats.json')

// lib/githubStats.ts의 repoSlug와 같은 규칙(중복이지만 이 스크립트는 앱 코드에 의존하지 않는다)
function repoSlug(url) {
  if (!url) return null
  const m = /^https?:\/\/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/.exec(String(url).trim())
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null
}

const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/items.json'), 'utf-8'))
const slugs = Array.from(new Set(items.map((i) => repoSlug(i.github)).filter(Boolean)))

let existing = {}
try {
  existing = JSON.parse(fs.readFileSync(OUT, 'utf-8'))
} catch {}

const headers = { Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const next = { ...existing }
let ok = 0
for (const slug of slugs) {
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, { headers })
    if (!res.ok) {
      console.warn(`skip ${slug}: HTTP ${res.status}`)
      continue
    }
    const j = await res.json()
    next[slug] = { stars: j.stargazers_count, forks: j.forks_count, fetchedAt: new Date().toISOString() }
    ok++
    console.log(`${slug}: ★${j.stargazers_count} fork ${j.forks_count}`)
  } catch (e) {
    console.warn(`skip ${slug}:`, e?.message ?? e)
  }
}

if (ok === 0 && Object.keys(existing).length > 0) {
  console.warn('가져온 레포가 없어 기존 파일을 그대로 둔다')
  process.exit(0)
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n')
console.log(`\n${ok}/${slugs.length}개 갱신 → ${OUT}`)
