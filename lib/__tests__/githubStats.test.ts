import { describe, it, expect } from 'vitest'
import { repoSlug, applyGithubStats } from '@/lib/githubStats'

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

describe('applyGithubStats', () => {
  it('저장값이 있으면 ★ 숫자만 최신으로, 라벨·다른 줄은 그대로', () => {
    // content/github-stats.json에 foxibu/CTF-Solver ★59가 있다(스크립트가 채움)
    const out = applyGithubStats('★ 53 | GitHub 스타\n55+ | 감싼 보안도구', 'https://github.com/foxibu/CTF-Solver')
    expect(out).toContain('★ 59 | GitHub 스타')
    expect(out).toContain('55+ | 감싼 보안도구')
  })
  it('★ 줄이 없으면 원문 그대로', () => {
    expect(applyGithubStats('20 | 선별 어휘', 'https://github.com/foxibu/CTF-Solver')).toBe('20 | 선별 어휘')
  })
  it('저장값 없는 레포는 원문 그대로(손으로 적은 값이 폴백)', () => {
    expect(applyGithubStats('★ 99 | stars', 'https://github.com/unknown/repo')).toBe('★ 99 | stars')
  })
})
