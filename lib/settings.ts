import path from 'path'
import { readJsonFile, writeJsonAtomic } from '@/lib/jsonFile'
import type { SiteSettings } from '@/types'

const FILE = path.join(process.cwd(), 'content/settings.json')

const DEFAULT_SETTINGS: SiteSettings = {
  devMode: false,
  navVisibility: {
    gallery: true,
    books: true,
    music: true,
  },
  profile: {
    name: '이름',
    bio: '개발자입니다.',
    avatar: '',
    skills: ['Next.js', 'TypeScript', 'React'],
    github: '',
    linkedin: '',
    email: '',
    aboutText: '소개 텍스트를 입력하세요.',
  },
}

function withDefaults(saved: Partial<SiteSettings>): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    navVisibility: { ...DEFAULT_SETTINGS.navVisibility, ...(saved.navVisibility ?? {}) },
    profile: { ...DEFAULT_SETTINGS.profile, ...(saved.profile ?? {}) },
  }
}

// 화면 표시용 — 파일이 깨져도 기본 설정으로 페이지는 뜬다
export function getSettings(): SiteSettings {
  try {
    return withDefaults(readJsonFile<Partial<SiteSettings>>(FILE, {}))
  } catch (err) {
    console.error(err)
    return DEFAULT_SETTINGS
  }
}

export function updateSettings(updates: Partial<SiteSettings>): SiteSettings {
  // 깨진 파일이면 예외 — 기본값(이름 '이름' 등)으로 실제 프로필을 덮어쓰지 않는다
  const current = withDefaults(readJsonFile<Partial<SiteSettings>>(FILE, {}))
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
  writeJsonAtomic(FILE, merged)
  return merged
}
