export interface BlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
  category?: string
  excerpt: string
  content: string
  status: 'published' | 'draft'
  readingTime: number
}

export interface Project {
  id: string
  name: string
  description: string
  skills: string[]
  github?: string
  link?: string
  thumbnail?: string
  order: number
}

export interface GalleryImage {
  id: string
  filename: string
  category: string
  description: string
  createdAt: string
}

export interface Activity {
  year: string
  title: string
  description?: string
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
}

export interface SiteSettings {
  devMode: boolean
  profile: {
    name: string
    bio: string
    avatar: string
    skills: string[]
    github: string
    linkedin: string
    aboutText: string
  }
}
