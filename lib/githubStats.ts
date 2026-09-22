import fs from 'fs'
import path from 'path'

// scripts/fetch-github-stats.ts가 하루 한 번 채운다. content 볼륨에 있고 git에는 올리지 않는다
// (views.json과 같은 런타임 상태). 파일이 없으면 metrics에 적어둔 값이 그대로 쓰인다.
const FILE = path.join(process.cwd(), 'content/github-stats.json')

export interface RepoStat {
  stars: number
  forks: number
  fetchedAt: string
}

/** { "owner/repo": { stars, forks, fetchedAt } } */
export function readGithubStats(): Record<string, RepoStat> {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return {}
  }
}

/** GitHub URL에서 "owner/repo"를 뽑는다. 조직 루트(owner만)나 비-github 주소는 null. */
export function repoSlug(githubUrl?: string): string | null {
  if (!githubUrl) return null
  const m = /^https?:\/\/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/.exec(githubUrl.trim())
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null
}

/**
 * metrics 문자열의 "★ N" 값을 저장된 최신 스타 수로 바꾼다.
 * 저장값이 없거나 ★ 줄이 없으면 원문 그대로 둔다(손으로 적은 값이 폴백).
 */
export function applyGithubStats(metrics: string | undefined, githubUrl: string | undefined): string | undefined {
  if (!metrics) return metrics
  const slug = repoSlug(githubUrl)
  if (!slug) return metrics
  const stat = readGithubStats()[slug]
  if (!stat) return metrics
  // "★ 59 | GitHub 스타" → 숫자만 최신값으로. 한/영 라벨 모두 유지.
  return metrics.replace(/(★\s*)\d[\d,]*/g, `$1${stat.stars}`)
}
