'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/types/database';
import { BOOK_THEMES } from '@/lib/themes';
import { BookOpen, CheckCircle2, Clock, Star, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  onToggleFavorite?: (bookId: string, isFav: boolean) => void;
  onDelete?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onToggleFavorite,
  onDelete,
}) => {
  const theme = BOOK_THEMES[book.cover_theme] || BOOK_THEMES.classic;
  const total = book.total_tasks || 0;
  const completed = book.completed_tasks || 0;
  const pending = book.pending_tasks || (total - completed);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top Cover Visual (3D notebook aesthetic) */}
      <Link href={`/books/${book.id}`} className="block relative overflow-hidden">
        <div
          className={cn(
            'h-44 w-full bg-linear-to-br p-5 flex flex-col justify-between relative transition-transform duration-300 group-hover:scale-[1.02]',
            theme.gradient
          )}
        >
          {/* Notebook Left Spine Shadow / Stitch Line */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/25 border-r border-white/10" />
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

          {/* Top category badge & Favorite Star */}
          <div className="flex items-center justify-between z-10 pl-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-xs text-white/90 border border-white/15">
              {book.category || 'Notebook'}
            </span>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(book.id, !book.is_favorite);
                }}
                className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-colors"
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    book.is_favorite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-white/60'
                  )}
                />
              </button>
            )}
          </div>

          {/* Book Title on Cover */}
          <div className="z-10 pl-3">
            <h3
              className={cn(
                'text-lg font-bold line-clamp-2 leading-snug drop-shadow-md',
                theme.text
              )}
            >
              {book.title}
            </h3>
            {book.purpose && (
              <p className="text-xs text-white/75 mt-0.5 line-clamp-1">
                {book.purpose}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Book Metadata & Progress Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Pages & Tasks Summary */}
        <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Pages
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {book.page_count || 1}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-emerald-500 uppercase font-semibold">
              Done
            </span>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {completed}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-amber-500 uppercase font-semibold">
              Pending
            </span>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {pending}
            </p>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Task Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Link
            href={`/books/${book.id}`}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Open Notebook
          </Link>

          {onDelete && (
            <button
              onClick={() => onDelete(book.id)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
