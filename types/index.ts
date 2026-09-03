export interface BlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
  category?: string
  excerpt: string
  content: string
  /** 본문 저장 형식: 'markdown'(기존 글) | 'html'(무손실 에디터 저장) */
  contentFormat: 'markdown' | 'html'
  status: 'published' | 'draft'
  readingTime: number
  /** 본문에서 추출한 첫 이미지 URL (이미지 뷰 커버용) */
  cover?: string
}

export interface GalleryImage {
  id: string
  filename: string
  category: string
  description: string
  createdAt: string
}

export interface PortfolioItem {
  id: string
  type: 'project' | 'activity' | 'award'
  year: string
  title: string
  description?: string
  skills?: string[]
  github?: string
  link?: string
  thumbnail?: string
  order?: number
  /** 영문 페이지(/en)용 번역. 비어 있으면 한국어로 폴백한다. */
  title_en?: string
  description_en?: string
}

export interface SiteSettings {
  devMode: boolean
  navVisibility: {
    gallery: boolean
    books: boolean
    music: boolean
  }
  profile: {
    name: string
    bio: string
    avatar: string
    skills: string[]
    github: string
    linkedin: string
    email: string
    aboutText: string
  }
}
