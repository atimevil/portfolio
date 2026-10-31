export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { hiddenFromPublic } from '@/lib/publicGate'
import { getAllBooks } from '@/lib/books'
import BooksList from '@/components/books/BooksList'
import { buildPageMetadata } from '@/lib/site'
import { getSettings } from '@/lib/settings'

export function generateMetadata() {
  return buildPageMetadata({
    path: '/books',
    noindex: !getSettings().navVisibility.books,
    title: '책',
    description: '읽고 있는 책, 읽은 책, 읽고 싶은 책',
  })
}

export default async function BooksPage() {
  // 설정에서 비공개로 둔 메뉴는 방문자에게 없는 페이지로 보인다(로그인한 관리자는 그대로 본다)
  if (await hiddenFromPublic('books')) notFound()
  const books = await getAllBooks()

  return (
    <main id="main" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 outline-none">
      <header className="mb-6">
        <h1 className="page-title">책</h1>
        <p className="mt-1 text-sm text-text-secondary">읽고 있는 책, 읽은 책, 읽고 싶은 책</p>
      </header>

      <BooksList books={books} />
    </main>
  )
}
