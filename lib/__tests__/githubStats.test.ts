import { describe, it, expect } from 'vitest'
import { repoSlug, applyGithubStats, type RepoStat } from '@/lib/githubStats'

describe('repoSlug', () => {
  it('owner/repo 추출, .git 제거', () => {
    expect(repoSlug('https://github.com/foxibu/CTF-Solver')).toBe('foxibu/CTF-Solver')
    expect(repoSlug('https://github.com/atimevil/x.git')).toBe('atimevil/x')
  })
  it('조직 루트·비-github·빈값은 null', () => {
    expect(repoSlug('https://github.com/pallows')).toBeNull()
    expect(repoSlug('https://example.com/a/b')).toBeNull()
    expect(repoSlug(undefined)).toBeNull()
  })
})

// 실제 파일(content/github-stats.json)은 gitignore라 CI엔 없다.
// 함수에 stats를 주입해 파일 상태와 무관하게 검증한다.
const STATS: Record<string, RepoStat> = {
  'foxibu/CTF-Solver': { stars: 59, forks: 7, fetchedAt: '2026-09-22T00:00:00Z' },
}

describe('applyGithubStats', () => {
  it('주입값이 있으면 ★ 숫자만 최신으로, 라벨·다른 줄은 그대로', () => {
    const out = applyGithubStats('★ 53 | GitHub 스타\n55+ | 감싼 보안도구', 'https://github.com/foxibu/CTF-Solver', STATS)
    expect(out).toContain('★ 59 | GitHub 스타')
    expect(out).toContain('55+ | 감싼 보안도구')
  })
  it('★ 줄이 없으면 원문 그대로', () => {
    expect(applyGithubStats('20 | 선별 어휘', 'https://github.com/foxibu/CTF-Solver', STATS)).toBe('20 | 선별 어휘')
  })
  it('주입값 없는 레포는 원문 그대로(손으로 적은 값이 폴백)', () => {
    expect(applyGithubStats('★ 99 | stars', 'https://github.com/unknown/repo', STATS)).toBe('★ 99 | stars')
  })
  it('stats를 안 넘기면 저장 파일을 읽되, 없어도 원문을 깨지 않는다', () => {
    const out = applyGithubStats('★ 42 | stars', 'https://github.com/nobody/none')
    expect(out).toBe('★ 42 | stars')
  })
})
