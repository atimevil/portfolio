import { notFound } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { getSettings } from '@/lib/settings'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import ViewIncrementer from '@/components/blog/ViewIncrementer'

interface Props {
  params: { slug: string }
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

export default async function BlogPostPage({ params: { slug } }: Props) {
  const post = getPostBySlug(slug)
  if (!post || post.status !== 'published') notFound()

  const settings = getSettings()
  const allPosts = getAllPosts()
  const idx = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const nextPost = idx > 0 ? allPosts[idx - 1] : null

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <div className="flex gap-12">
        <Sidebar settings={settings} />
        <article className="flex-1 min-w-0">
          <ViewIncrementer slug={slug} />
          <header className="mb-8 pb-6 border-b border-border">
            <h1 className="text-2xl font-bold text-text-primary mb-3">{post.title}</h1>
            <p className="text-sm text-text-muted">
              {post.date} · {post.readingTime}분 읽기
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkMath],
                  rehypePlugins: [rehypeKatex],
                },
              }}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between gap-4">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`}
                className="flex-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
                ← {prevPost.title}
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`}
                className="flex-1 text-right text-sm text-text-secondary hover:text-text-primary transition-colors">
                {nextPost.title} →
              </Link>
            ) : <div />}
          </div>
        </article>
      </div>
    </main>
  )
}
