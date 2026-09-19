import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { buildPageMetadata } from '@/lib/site'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeCollapsibleCode from '@/lib/mdx/rehypeCollapsibleCode'
import { renderBlogHtml } from '@/lib/renderBlogHtml'
import ViewIncrementer from '@/components/blog/ViewIncrementer'
import TagBadges from '@/components/blog/TagBadges'

interface Props {
  params: { slug: string }
}

// 로그인 여부에 따라 수정 버튼이 달라지므로 요청마다 렌더한다
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}
  const meta = buildPageMetadata({
    path: `/blog/${params.slug}`,
    title: post.title,
    description: post.excerpt,
  })
  return { ...meta, openGraph: { ...meta.openGraph, type: 'article' } }
}

export default async function BlogPostPage({ params: { slug } }: Props) {
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const session = await getServerSession(authOptions)
  // 미발행(임시) 글은 로그인한 관리자만 미리보기로 볼 수 있다 (비로그인은 404)
  const isDraft = post.status !== 'published'
  if (isDraft && !session) notFound()

  const allPosts = await getAllPosts()
  const idx = allPosts.findIndex((p) => p.slug === slug)
  // 이전/다음은 발행 글 목록 기준 (임시 글은 목록에 없으므로 네비 생략)
  const prevPost = idx !== -1 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null
  const nextPost = idx > 0 ? allPosts[idx - 1] : null

  // html 글은 정제+하이라이트한 HTML을, markdown 글은 기존 MDX 파이프라인을 쓴다.
  const htmlRendered = post.contentFormat === 'html' ? await renderBlogHtml(post.content) : null

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <article className="min-w-0">
        {!isDraft && <ViewIncrementer slug={slug} />}
        <header className="mb-8 pb-6 border-b border-border">
          {isDraft && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
              임시저장(미발행) 글입니다 · 관리자에게만 보입니다
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-3">{post.title}</h1>
            {session && (
              <Link
                href={`/admin/blog/edit/${slug}`}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
              >
                ✏️ 수정
              </Link>
            )}
          </div>
          <p className="text-sm text-text-muted">
            {post.date} · {post.readingTime}분 읽기
          </p>
          <TagBadges tags={post.tags} category={post.category} className="mt-3" />
        </header>

        {htmlRendered !== null ? (
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlRendered }}
          />
        ) : (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm, remarkMath],
                  rehypePlugins: [rehypeKatex, rehypeCollapsibleCode, [rehypePrettyCode, { theme: 'material-theme-palenight', keepBackground: false }]],
                },
              }}
            />
          </div>
        )}

        {/* 화살표만 있으면 어느 쪽이 이전인지 알 수 없고, 제목이 길면 두 칸이 서로 밀린다.
            라벨을 붙이고 제목은 두 줄로 자른다. */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-8" aria-label="글 이동">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="group rounded-lg border border-border p-3 transition-colors hover:border-accent"
            >
              <span className="block text-xs text-text-muted">← 이전 글</span>
              <span className="mt-1 block line-clamp-2 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                {prevPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group rounded-lg border border-border p-3 text-right transition-colors hover:border-accent"
            >
              <span className="block text-xs text-text-muted">다음 글 →</span>
              <span className="mt-1 block line-clamp-2 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </main>
  )
}
