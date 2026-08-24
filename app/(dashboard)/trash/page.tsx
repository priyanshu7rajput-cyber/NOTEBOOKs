'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Book } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function TrashPage() {
  const { user, isDemoMode } = useAuth();
  const [deletedBooks, setDeletedBooks] = useState<Book[]>([]);
  const supabase = createClient();

  const fetchDeleted = async () => {
    if (isDemoMode || !user) {
      setDeletedBooks([]);
      return;
    }

    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', true);

    if (data) setDeletedBooks(data as Book[]);
  };

  useEffect(() => {
    fetchDeleted();
  }, [user, isDemoMode]);

  const handleRestore = async (bookId: string) => {
    setDeletedBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (!isDemoMode && user) {
      await supabase
        .from('books')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', bookId)
        .eq('user_id', user.id);
    }
  };

  const handlePermanentDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to permanently delete this notebook? This action cannot be undone.')) return;

    setDeletedBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (!isDemoMode && user) {
      await supabase.from('books').delete().eq('id', bookId).eq('user_id', user.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Trash2 className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trash</h1>
          <p className="text-xs text-slate-500">
            Recover deleted notebooks or delete them permanently.
          </p>
        </div>
      </div>

      {deletedBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
          Trash is empty. No deleted notebooks found.
        </div>
      ) : (
        <div className="space-y-3">
          {deletedBooks.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {book.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {book.purpose || 'Notebook'} • Deleted on{' '}
                  {book.deleted_at ? new Date(book.deleted_at).toLocaleDateString() : 'recently'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(book.id)}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handlePermanentDelete(book.id)}
                  className="gap-1 text-xs"
                >
                  Delete Forever
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
