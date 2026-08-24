'use client';

import React from 'react';

interface RuledPaperProps {
  pageNumber: number;
  headerTitle?: string;
  onHeaderTitleChange?: (title: string) => void;
  headerDate?: string;
  onHeaderDateChange?: (date: string) => void;
  children: React.ReactNode;
}

export const RuledPaper: React.FC<RuledPaperProps> = ({
  pageNumber,
  headerTitle = '',
  onHeaderTitleChange,
  headerDate = '',
  onHeaderDateChange,
  children,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto my-3 transition-all duration-300">
      {/* Physical Copy Page Outer Frame matching exact reference image */}
      <div className="relative shadow-2xl border border-slate-300 dark:border-slate-800 bg-white overflow-hidden rounded-sm">

        {/* Top Header Region with Double Pink Line and Editable Heading */}
        <div className="h-[75px] w-full exact-top-margin relative bg-white flex items-center">

          {/* Vertical Pink Margin Line through top header with Page indicator */}
          <div className="w-16 sm:w-20 h-full exact-margin-line shrink-0 flex items-center justify-center bg-white">
            <span className="text-[11px] font-mono text-rose-500 font-bold">
              P.{pageNumber}
            </span>
          </div>

          {/* Top Header Editable Area: Title / Subject in Bold Handwriting */}
          <div className="flex-1 px-4 flex items-center justify-between gap-4">
            <input
              type="text"
              value={headerTitle}
              onChange={(e) => onHeaderTitleChange && onHeaderTitleChange(e.target.value)}
              placeholder="Enter Heading / Subject (e.g. Unit 1 Notes)..."
              className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none text-slate-900 focus:outline-none placeholder:text-slate-300 transition-all font-[var(--font-kalam)]"
              style={{ fontFamily: 'var(--font-kalam)', fontWeight: 700 }}
            />

            {/* Optional Date Stamp on the Right */}
            <input
              type="text"
              value={headerDate}
              onChange={(e) => onHeaderDateChange && onHeaderDateChange(e.target.value)}
              placeholder="Date: DD/MM/YY"
              className="w-32 text-xs font-mono text-slate-500 text-right bg-transparent border-none focus:outline-none placeholder:text-slate-300 shrink-0"
            />
          </div>
        </div>

        {/* Main Ruled Lines Body (Pure White Background) */}
        <div className="relative flex exact-notebook-paper bg-white">

          {/* Vertical Pink Margin Line down the page */}
          <div className="w-16 sm:w-20 shrink-0 exact-margin-line relative" />

          {/* Ruled Writing Area - Strict Left to Right */}
          <div className="flex-1 pl-3 sm:pl-4 pr-4 sm:pr-8 py-0 relative overflow-hidden text-left" dir="ltr">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
