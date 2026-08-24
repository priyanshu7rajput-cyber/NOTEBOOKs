'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Search, BookOpen, FileText, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'book' | 'page' | 'task';
  title: string;
  subtitle: string;
  bookId?: string;
  pageId?: string;
  taskId?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const term = `%${query.trim()}%`;
        const res: SearchResultItem[] = [];

        // Search Books
        const { data: books } = await supabase
          .from('books')
          .select('id, title, purpose, category')
          .ilike('title', term)
          .eq('is_deleted', false)
          .limit(5);

        if (books) {
          books.forEach((b) => {
            res.push({
              id: b.id,
              type: 'book',
              title: b.title,
              subtitle: `Notebook • ${b.category || 'General'}`,
              bookId: b.id,
            });
          });
        }

        // Search Pages
        const { data: pages } = await supabase
          .from('pages')
          .select('id, title, page_number, book_id')
          .ilike('title', term)
          .eq('is_deleted', false)
          .limit(5);

        if (pages) {
          pages.forEach((p) => {
            res.push({
              id: p.id,
              type: 'page',
              title: p.title || 'Untitled Page',
              subtitle: `Page ${p.page_number}`,
              bookId: p.book_id,
              pageId: p.id,
            });
          });
        }

        // Search Tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, book_id, page_id')
          .ilike('title', term)
          .eq('is_deleted', false)
          .limit(5);

        if (tasks) {
          tasks.forEach((t) => {
            res.push({
              id: t.id,
              type: 'task',
              title: t.title,
              subtitle: 'Task checklist item',
              bookId: t.book_id,
              pageId: t.page_id,
              taskId: t.id,
            });
          });
        }

        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'book') {
      router.push(`/books/${item.bookId}`);
    } else if (item.type === 'page' && item.bookId) {
      router.push(`/books/${item.bookId}?page=${item.pageId}`);
    } else if (item.type === 'task' && item.bookId) {
      router.push(`/books/${item.bookId}?page=${item.pageId}&task=${item.taskId}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type book name, page title, task..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results List */}
        <div className="min-h-[200px] max-h-[350px] overflow-y-auto space-y-1">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-xs">Searching records...</span>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching books, pages, or tasks found for &quot;{query}&quot;
            </div>
          )}

          {!isLoading &&
            results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    {item.type === 'book' && <BookOpen className="w-4 h-4" />}
                    {item.type === 'page' && <FileText className="w-4 h-4" />}
                    {item.type === 'task' && <CheckSquare className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
              </button>
            ))}
        </div>
      </div>
    </Modal>
  );
};
