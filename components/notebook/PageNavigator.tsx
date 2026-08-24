'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Page } from '@/types/database';

interface PageNavigatorProps {
  pages: Page[];
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage?: (pageId: string) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
}) => {
  const currentIndex = pages.findIndex((p) => p.id === currentPageId);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectPage(pages[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      onSelectPage(pages[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 shadow-xs mb-4">
      {/* Pagination arrows */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="h-8 px-2.5"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono px-2">
          Page {currentIndex + 1} of {pages.length || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex >= pages.length - 1}
          className="h-8 px-2.5"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Direct Page Selector dropdown */}
      <div className="flex items-center gap-2">
        <select
          value={currentPageId}
          onChange={(e) => onSelectPage(e.target.value)}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          {pages.map((p, idx) => (
            <option key={p.id} value={p.id}>
              Page {idx + 1}: {p.title || 'Untitled'}
            </option>
          ))}
        </select>

        {/* Add Page button */}
        <Button size="sm" onClick={onAddPage} className="h-8 gap-1">
          <Plus className="w-3.5 h-3.5" />
          Add Page
        </Button>

        {/* Delete Page button */}
        {pages.length > 1 && onDeletePage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeletePage(currentPageId)}
            title="Delete this page"
            className="w-8 h-8 text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
