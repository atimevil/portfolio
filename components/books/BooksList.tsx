'use client'

import { useMemo, useState } from 'react'
import type { Book } from '@prisma/client'

type Tab = 'reading' | 'done' | 'want'

const TAB_LABEL: Record<Tab, string> = {
  reading: '읽는 중',
  done: '다 읽음',
  want: '읽고 싶음',
}

interface Props {
  books: Book[]
}

function groupByGenre(books: Book[]): [string, Book[]][] {
  const groups = new Map<string, Book[]>()
  for (const book of books) {
    const key = book.genre || '기타'
    const list = groups.get(key) ?? []
    list.push(book)
    groups.set(key, list)
  }
  // 그룹 내부는 이미 최신순(getAllBooks의 orderBy)으로 들어와 있으므로 그대로 유지, 그룹 자체는 이름순
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ko'))
}

export default function BooksList({ books }: Props) {
  const [tab, setTab] = useState<Tab>('reading')

  const counts = {
    reading: books.filter((b) => b.status === 'reading').length,
    done: books.filter((b) => b.status === 'done').length,
    want: books.filter((b) => b.status === 'want').length,
  }

  const visible = useMemo(() => books.filter((b) => b.status === tab), [books, tab])
  const grouped = useMemo(() => groupByGenre(visible), [visible])

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-border">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-accent text-text-primary font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="text-center text-text-secondary py-10 text-sm">아직 없습니다.</p>
      )}

      {grouped.map(([genre, list]) => (
        <div key={genre} className="mb-8">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            {genre}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((book) => (
              <div key={book.id} className="border border-border rounded-lg p-4 bg-bg-secondary">
                <h3 className="font-medium text-text-primary">{book.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{book.author}</p>
                {book.status === 'done' && book.rating != null && (
                  <p className="text-sm text-accent mt-2">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
                )}
                {book.memo && <p className="text-sm text-text-secondary mt-2">{book.memo}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
