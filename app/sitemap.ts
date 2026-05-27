import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yourdomain.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/ko/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: `${BASE_URL}/ko`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/ko/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/ko/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...postEntries,
  ]
}
