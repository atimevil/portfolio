import fs from 'fs'
import path from 'path'
import type { SiteSettings } from '@/types'

const FILE = path.join(process.cwd(), 'content/settings.json')

const DEFAULT_SETTINGS: SiteSettings = {
  devMode: false,
  navVisibility: {
    gallery: true,
    books: true,
    music: true,
    projects: true,
  },
  profile: {
    name: '이름',
    bio: '개발자입니다.',
    avatar: '',
    skills: ['Next.js', 'TypeScript', 'React'],
    github: '',
    linkedin: '',
    aboutText: '소개 텍스트를 입력하세요.',
  },
}

export function getSettings(): SiteSettings {
  if (!fs.existsSync(FILE)) return DEFAULT_SETTINGS
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf-8')) as Partial<SiteSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      navVisibility: { ...DEFAULT_SETTINGS.navVisibility, ...(saved.navVisibility ?? {}) },
      profile: { ...DEFAULT_SETTINGS.profile, ...(saved.profile ?? {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function updateSettings(updates: Partial<SiteSettings>): SiteSettings {
  const current = getSettings()
  const merged: SiteSettings = {
    ...current,
    ...updates,
    navVisibility: {
      ...current.navVisibility,
      ...(updates.navVisibility ?? {}),
    },
    profile: {
      ...current.profile,
      ...(updates.profile ?? {}),
    },
  }
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}
