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
  thumbnail?: string
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
  /** 위 네 칸의 영문. 지표는 줄 수·값을 한국어판과 같게 두고 라벨만 옮긴다. */
  problem_en?: string
  contribution_en?: string
  result_en?: string
  metrics_en?: string
  /** 홈 카드 한 줄 — 밖에서 확인되는 결과(수상·게재·사용량). 비우면 지표 첫 줄을 쓴다. */
  highlight?: string
  /** 홈 카드 한 줄 — 팀 규모와 맡은 부분. 팀 작업에서 내 몫을 부풀리지 않게 따로 적는다. */
  role?: string
  highlight_en?: string
  role_en?: string
  /** 상세 페이지 영상. 유튜브 주소(일부 공개 권장) 또는 /videos/... .mp4·.webm 경로. 그림 아래에 붙는다. */
  video?: string
  /** 소리 없이 되풀이할 짧은 영상 파일(/videos/....mp4·.webm). 있으면 홈 대표 타일의 영상 액자에 쓴다. 상세에서는 장면 모드 유튜브나
   *  유튜브 영상이 없을 때만 대신 쓴다(본선 대국처럼 평범한 플레이어로 건 유튜브는 그대로).
   *  — 유튜브 임베드는 채널명·일시정지 아이콘·'동영상 더보기'를 화면에 그려서 움짤처럼 보이지 않는다. */
  loop?: string
  /** 대회·학회 포스터 이미지(/uploads/gallery/....jpg 등). 상세에서 윗부분만 미리 보이고, 누르면 원본이 열린다. */
  poster?: string
  /** 무언가를 재고 평가한 작업(연구·경진대회). 홈의 '연구 · 경진대회'에 모인다. 종류(type)와 무관하다. */
  measure?: boolean
  /** 소개(/about)에 노출한다. 꺼져 있으면 등록만 되고 목록에는 안 나온다(직접 URL로는 열림). */
  visible?: boolean
  /** 홈 '프로젝트'에 띄울 대표 작업. visible 중에서 고른다. */
  featured?: boolean
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
    /** 개인 계정 말고 함께 쓰는 GitHub(조직) 주소. 비우면 안 나온다. */
    github_org?: string
    linkedin: string
    email: string
    aboutText: string
    /** 소속(학교·학과·학년). 이름 옆에 사실 그대로 적는다. */
    affiliation?: string
    affiliation_en?: string
    /** 홈 이름 아래 한 문장. 비우면 이름과 소속만 나온다. */
    headline?: string
    headline_en?: string
  }
}
