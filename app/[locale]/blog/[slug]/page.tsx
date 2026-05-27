import { notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import Badge from '@/components/ui/Badge'
import ViewCounter from '@/components/blog/ViewCounter'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { MDXRemote } from 'next-mdx-remote/rsc'

interface Props {
  params: { locale: string; slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params: { locale, slug } }: Props) {
  const post = getPostBySlug(slug)
  if (!post || post.status !== 'published') notFound()

  const settings = getSettings()
  const allPosts = getAllPosts()
  const idx = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const nextPost = idx > 0 ? allPosts[idx - 1] : null

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          <article className="flex-1 min-w-0">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-3">{post.title}</h1>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                <span>{post.date}</span>
                <span>·</span>
                <span>읽기 {post.readingTime}분</span>
                <span>·</span>
                <ViewCounter slug={slug} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="tag">{tag}</Badge>
                ))}
              </div>
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <MDXRemote source={post.content} />
            </div>

            <div className="mt-12 pt-8 border-t border-border flex justify-between gap-4">
              {prevPost ? (
                <Link href={`/${locale}/blog/${prevPost.slug}`}
                  className="flex-1 text-sm text-text-secondary hover:text-primary transition-colors">
                  ← {prevPost.title}
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link href={`/${locale}/blog/${nextPost.slug}`}
                  className="flex-1 text-right text-sm text-text-secondary hover:text-primary transition-colors">
                  {nextPost.title} →
                </Link>
              ) : <div />}
            </div>
          </article>

          <Sidebar settings={settings} recentPosts={allPosts.slice(0, 5)} locale={locale} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
