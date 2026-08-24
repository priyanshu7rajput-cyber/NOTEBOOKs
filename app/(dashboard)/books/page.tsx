'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Book, CoverTheme } from '@/types/database';
import { BookCard } from '@/components/books/BookCard';
import { CreateBookDialog } from '@/components/books/CreateBookDialog';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter } from 'lucide-react';

export default function BooksPage() {
  const { user, isDemoMode } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchBooks = async () => {
    if (isDemoMode || !user) {
      setBooks([
        {
          id: 'demo-b1',
          user_id: 'demo-user-12345',
          title: 'MCA 3rd Semester',
          purpose: 'Study and Assignments',
          description: 'Computer graphics, algorithms, and semester projects',
          category: 'Study',
          cover_theme: 'classic',
          cover_theme_value: 'classic-slate',
          cover_image_url: null,
          is_favorite: true,
          is_deleted: false,
          deleted_at: null,
          last_opened_page_id: 'demo-p1',
          page_count: 24,
          total_tasks: 80,
          completed_tasks: 52,
          pending_tasks: 28,
          progress_percentage: 65,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-b2',
          user_id: 'demo-user-12345',
          title: 'Full Stack Project Tracker',
          purpose: 'Design & Code Architecture',
          description: 'Next.js, Supabase, and RLS implementation notes',
          category: 'Programming',
          cover_theme: 'code',
          cover_theme_value: 'code-term',
          cover_image_url: null,
          is_favorite: false,
          is_deleted: false,
          deleted_at: null,
          last_opened_page_id: 'demo-p2',
          page_count: 14,
          total_tasks: 25,
          completed_tasks: 18,
          pending_tasks: 7,
          progress_percentage: 72,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-b3',
          user_id: 'demo-user-12345',
          title: 'Personal Journal & Reflections',
          purpose: 'Daily Thoughts',
          description: 'Reflections and morning routines',
          category: 'Personal',
          cover_theme: 'gradient',
          cover_theme_value: 'grad-aurora',
          cover_image_url: null,
          is_favorite: true,
          is_deleted: false,
          deleted_at: null,
          last_opened_page_id: 'demo-p3',
          page_count: 8,
          total_tasks: 10,
          completed_tasks: 9,
          pending_tasks: 1,
          progress_percentage: 90,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (data) {
        setBooks(data as Book[]);
      }
    } catch (err) {
      console.error('Fetch books error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [user, isDemoMode]);

  const handleToggleFavorite = async (bookId: string, isFav: boolean) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, is_favorite: isFav } : b))
    );

    if (!isDemoMode && user) {
      await supabase
        .from('books')
        .update({ is_favorite: isFav })
        .eq('id', bookId)
        .eq('user_id', user.id);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));

    if (!isDemoMode && user) {
      // Soft deletion
      await supabase
        .from('books')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', bookId)
        .eq('user_id', user.id);
    }
  };

  const handleCreateBook = async (data: {
    title: string;
    purpose: string;
    description: string;
    category: string;
    cover_theme: CoverTheme;
  }) => {
    if (!isDemoMode && user) {
      const { data: newBook } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: data.title,
          purpose: data.purpose,
          description: data.description,
          category: data.category,
          cover_theme: data.cover_theme,
        })
        .select()
        .single();

      if (newBook) {
        // Insert Page 1
        await supabase.from('pages').insert({
          book_id: newBook.id,
          user_id: user.id,
          title: 'Page 1',
          page_number: 1,
        });
        setBooks((prev) => [newBook as Book, ...prev]);
      }
    } else {
      const mockBook: Book = {
        id: `demo-${Date.now()}`,
        user_id: 'demo-user-12345',
        title: data.title,
        purpose: data.purpose,
        description: data.description,
        category: data.category,
        cover_theme: data.cover_theme,
        cover_theme_value: 'custom',
        cover_image_url: null,
        is_favorite: false,
        is_deleted: false,
        deleted_at: null,
        last_opened_page_id: null,
        page_count: 1,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBooks((prev) => [mockBook, ...prev]);
    }
  };

  const categories = ['all', 'Study', 'Programming', 'Personal', 'Work', 'Project', 'General'];

  const filteredBooks = books.filter((b) => {
    const matchesCat = filterCategory === 'all' || b.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Digital Notebooks
          </h1>
          <p className="text-xs text-slate-500">
            Organize your subjects, projects, and personal notes across custom ruled notebooks.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Create New Book
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search inside books */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter books..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No notebooks found
          </p>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `No notebooks match "${searchQuery}".`
              : 'Create your first notebook to get started.'}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            Create a Book
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      )}

      {/* Create Book Dialog */}
      <CreateBookDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateBook}
      />
    </div>
  );
}
