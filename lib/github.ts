// https://github.com/foxibu/ → 'foxibu'. 버튼에 계정 이름을 붙여 같은 GitHub 버튼끼리 구분한다.
export function githubHandle(url: string): string {
  return url.trim().replace(/\/+$/, '').split('/').pop() ?? ''
}
