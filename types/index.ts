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
  /** 상세 페이지 주소(/work/<slug>). 비어 있으면 id를 쓴다. */
  slug?: string
  /** 논문·발표 자료 링크. 연구 프로젝트는 결과물이 저장소가 아니라 논문이다. */
  paper?: string
  link?: string
  thumbnail?: string
  order?: number
  /** 영문 페이지(/en)용 번역. 비어 있으면 한국어로 폴백한다. */
  title_en?: string
  description_en?: string
  /**
   * 케이스 스터디 3분할. 셋 중 하나라도 있으면 /about이 카드 대신 케이스 형태로 그린다.
   * 없으면 description 한 문단으로 폴백한다.
   */
  problem?: string
  contribution?: string
  result?: string
  /** 지표 줄. 한 줄에 하나, "값 | 라벨" 형식. */
  metrics?: string
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
    /** 홈 맨 위 대표 사진. 비우면 아바타로 대신한다. */
    cover?: string
  }
}
