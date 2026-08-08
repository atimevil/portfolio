'use client'

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import type { SiteSettings } from '@/types'

interface AdminSettingsFormProps {
  initialSettings: SiteSettings
}

const NAV_TOGGLES = [
  { key: 'projects', label: '프로젝트' },
  { key: 'gallery', label: '갤러리' },
  { key: 'books', label: '책' },
  { key: 'music', label: '음악' },
] as const

export default function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [devMode, setDevMode] = useState(initialSettings.devMode)
  const [navVisibility, setNavVisibility] = useState(initialSettings.navVisibility)
  const [profile, setProfile] = useState(initialSettings.profile)
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handlePasswordChange() {
    if (pw.next.length < 8) { setPwMsg({ ok: false, text: '새 비밀번호는 8자 이상이어야 합니다.' }); return }
    if (pw.next !== pw.confirm) { setPwMsg({ ok: false, text: '새 비밀번호 확인이 일치하지 않습니다.' }); return }
    setPwSaving(true)
    setPwMsg(null)
    const res = await fetch('/api/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    })
    setPwSaving(false)
    if (res.ok) {
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ ok: true, text: '비밀번호가 변경되었습니다.' })
    } else {
      const data = await res.json().catch(() => ({}))
      setPwMsg({ ok: false, text: data.error || '변경에 실패했습니다.' })
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !profile.skills.includes(s)) {
      setProfile((p) => ({ ...p, skills: [...p.skills, s] }))
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setProfile((p) => ({ ...p, avatar: data.url }))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devMode, navVisibility, profile }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const avatarSrc = profile.avatar || (profile.github ? `https://avatars.githubusercontent.com/${profile.github.split('/').pop()}` : '')

  return (
    <div>
      <h1 className="text-lg font-semibold text-text-primary mb-7">설정</h1>

      <div className="flex flex-col gap-5">
        {/* 개발중 모드 */}
        <section className="bg-bg-secondary border border-border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">개발중 모드</p>
              <p className="text-xs text-text-muted mt-0.5">ON 시 방문자 차단, 관리자는 정상 접근</p>
            </div>
            <button
              role="switch"
              aria-checked={devMode}
              onClick={() => setDevMode(!devMode)}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none overflow-hidden shrink-0 ${
                devMode ? 'bg-text-primary' : 'bg-border'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                devMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </section>

        {/* 메뉴 노출 */}
        <section className="bg-bg-secondary border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-text-primary mb-1">메뉴 노출</h2>
          <p className="text-xs text-text-muted mb-4">OFF로 끄면 방문자 헤더 메뉴에서 사라짐 (블로그/소개는 항상 노출)</p>
          <div className="flex flex-col gap-3">
            {NAV_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm text-text-primary">{label}</p>
                <button
                  role="switch"
                  aria-checked={navVisibility[key]}
                  onClick={() => setNavVisibility((v) => ({ ...v, [key]: !v[key] }))}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none overflow-hidden shrink-0 ${
                    navVisibility[key] ? 'bg-text-primary' : 'bg-border'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    navVisibility[key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 프로필 편집 */}
        <section className="bg-bg-secondary border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-text-primary mb-4">프로필 편집</h2>

          {/* 아바타 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-surface overflow-hidden ring-2 ring-border shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-text-muted">👤</div>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? '업로드 중...' : '이미지 변경'}
              </Button>
              {profile.avatar && (
                <button
                  onClick={() => setProfile((p) => ({ ...p, avatar: '' }))}
                  className="ml-2 text-xs text-text-muted hover:text-red-500 transition-colors"
                >
                  제거
                </button>
              )}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { key: 'name', label: '이름', placeholder: '이름' },
              { key: 'bio', label: '한 줄 소개', placeholder: '한 줄 소개' },
              { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/...' },
              { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-text-muted mb-1">{label}</label>
                <input
                  type="text"
                  value={profile[key as keyof typeof profile] as string}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}
          </div>

          {/* 소개 텍스트 */}
          <div className="mb-4">
            <label className="block text-xs text-text-muted mb-1">소개 텍스트 (about 페이지)</label>
            <textarea
              value={profile.aboutText}
              onChange={(e) => setProfile((p) => ({ ...p, aboutText: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* 기술 스택 */}
          <div>
            <label className="block text-xs text-text-muted mb-2">기술 스택</label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {profile.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 bg-surface text-text-secondary text-xs px-2 py-0.5 rounded-md">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-text-muted hover:text-red-500 leading-none" aria-label={`${skill} 삭제`}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="기술 스택 추가 후 Enter"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <Button variant="secondary" size="sm" onClick={addSkill}>추가</Button>
            </div>
          </div>
        </section>

        {/* 비밀번호 변경 */}
        <section className="bg-bg-secondary border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-text-primary mb-1">비밀번호 변경</h2>
          <p className="text-xs text-text-muted mb-4">관리자 로그인 비밀번호를 변경합니다.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="password" value={pw.current} placeholder="현재 비밀번호" autoComplete="current-password"
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <input
              type="password" value={pw.next} placeholder="새 비밀번호 (8자 이상)" autoComplete="new-password"
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <input
              type="password" value={pw.confirm} placeholder="새 비밀번호 확인" autoComplete="new-password"
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${pwMsg ? (pwMsg.ok ? 'text-green-600' : 'text-red-500') : ''}`}>
              {pwMsg?.text ?? ''}
            </span>
            <Button variant="secondary" size="sm" onClick={handlePasswordChange} disabled={pwSaving}>
              {pwSaving ? '변경 중...' : '변경'}
            </Button>
          </div>
        </section>

      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
        </Button>
      </div>
    </div>
  )
}
