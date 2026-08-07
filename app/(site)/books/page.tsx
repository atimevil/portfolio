export const dynamic = 'force-dynamic'

import { getAllBooks } from '@/lib/books'
import BooksList from '@/components/books/BooksList'

export const metadata = {
  title: '책',
}

export default async function BooksPage() {
  const books = await getAllBooks()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">책</h1>
        <p className="mt-1 text-sm text-text-secondary">읽고 있는 책, 읽은 책, 읽고 싶은 책</p>
      </header>

      <BooksList books={books} />
    </main>
  )
}
