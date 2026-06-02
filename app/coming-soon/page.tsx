// 개발중 모드에서 비로그인 방문자가 리다이렉트되는 페이지.
// (site) 그룹 밖이라 devMode 게이트가 적용되지 않는다.
export const metadata = {
  title: '준비 중',
  robots: { index: false, follow: false },
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Coming soon</p>
      <h1 className="text-xl font-semibold text-text-primary mb-2">사이트 준비 중입니다</h1>
      <p className="text-sm text-text-secondary mb-6">곧 공개됩니다.</p>
      <a href="/admin/login" className="text-xs text-text-muted hover:text-text-primary transition-colors">
        관리자 로그인
      </a>
    </div>
  )
}
