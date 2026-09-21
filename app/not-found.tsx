import Link from 'next/link'
import { headers } from 'next/headers'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import { getSettings } from '@/lib/settings'

// 없는 주소·없는 프로젝트 슬러그로 들어왔을 때. Next 기본 화면("This page could not be
// found.")은 사이트 헤더도 돌아갈 곳도 없어서, 여기서 사이트 틀 안에 길을 보여준다.
export default function NotFound() {
  const locale = headers().get('x-locale') === 'en' ? 'en' : 'ko'
  const { profile, navVisibility } = getSettings()
  const en = locale === 'en'
  const home = en ? '/en' : '/'
  const about = en ? '/en/about' : '/about'

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <NavBar navVisibility={navVisibility} locale={locale} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-24 outline-none md:px-8">
        <p className="font-mono text-sm text-text-muted">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
          {en ? 'This page does not exist.' : '없는 페이지입니다.'}
        </h1>
        <p className="mt-3 text-text-secondary">
          {en ? 'The address may have changed. Try one of these instead.' : '주소가 바뀌었을 수 있습니다. 아래에서 찾아보세요.'}
        </p>
        <ul className="mt-8 flex flex-wrap gap-3 text-sm">
          {[
            { href: home, label: en ? 'Home' : '홈' },
            { href: about, label: en ? 'About & projects' : '소개 · 프로젝트' },
            { href: '/blog', label: en ? 'Writing (Korean)' : '글' },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-border px-4 text-text-primary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer email={profile.email} github={profile.github} name={profile.name} />
    </div>
  )
}
