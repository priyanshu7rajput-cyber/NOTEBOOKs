'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Book } from '@/types/database';
import { BookCard } from '@/components/books/BookCard';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  const { user, isDemoMode } = useAuth();
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadFavorites = async () => {
      if (isDemoMode || !user) {
        setFavoriteBooks([
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
            last_opened_page_id: null,
            page_count: 24,
            total_tasks: 80,
            completed_tasks: 52,
            pending_tasks: 28,
            progress_percentage: 65,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .eq('is_deleted', false);

      if (data) setFavoriteBooks(data as Book[]);
    };

    loadFavorites();
  }, [user, isDemoMode]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Favorite Notebooks
          </h1>
          <p className="text-xs text-slate-500">
            Quick access to your starred digital copies and notebooks.
          </p>
        </div>
      </div>

      {favoriteBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
          No favorite notebooks starred yet. Click the star icon on any book cover to add it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
