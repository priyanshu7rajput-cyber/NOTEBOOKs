'use client';

import React from 'react';
import {
  Keyboard,
  PenTool,
  CheckSquare,
  Undo2,
  Redo2,
  Eraser,
  Type,
  Check,
  Loader2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type NotebookMode = 'type' | 'handwrite';

interface NotebookToolbarProps {
  mode: NotebookMode;
  onModeChange: (mode: NotebookMode) => void;
  // Handwriting ink tools
  penColor?: string;
  onPenColorChange?: (color: string) => void;
  penSize?: number;
  onPenSizeChange?: (size: number) => void;
  isEraser?: boolean;
  onToggleEraser?: () => void;
  onClearCanvas?: () => void;
  // Selected Text formatting
  onApplyTextColor?: (color: string) => void;
  onApplyTextFont?: (font: string) => void;
  onToggleChecklist?: () => void;
  onExportPendingPDF?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  saveStatus?: 'saved' | 'saving' | 'error';
}

export const NotebookToolbar: React.FC<NotebookToolbarProps> = ({
  mode,
  onModeChange,
  penColor = '#000000',
  onPenColorChange,
  penSize = 3.5,
  onPenSizeChange,
  isEraser = false,
  onToggleEraser,
  onClearCanvas,
  onApplyTextColor,
  onApplyTextFont,
  onToggleChecklist,
  onExportPendingPDF,
  onUndo,
  onRedo,
  saveStatus = 'saved',
}) => {
  // 3 Primary Pen Inks requested by user
  const textPenColors = [
    { label: 'Black Ink', value: '#000000', dot: 'bg-black' },
    { label: 'Blue Ink', value: '#1d4ed8', dot: 'bg-blue-700' },
    { label: 'Red Ink', value: '#dc2626', dot: 'bg-red-600' },
  ];

  const handwritingFonts = [
    { label: '✍️ Kalam (Cursive)', value: 'var(--font-kalam)' },
    { label: '✍️ Patrick Hand (Neat Script)', value: 'var(--font-patrick)' },
    { label: '✍️ Indie Flower (Soft Hand)', value: 'var(--font-indie)' },
    { label: '✍️ Caveat (Clean Hand)', value: 'var(--font-caveat)' },
    { label: '✍️ Architects (Ballpoint)', value: 'var(--font-architects)' },
    { label: '✍️ Shadows (Gel Pen)', value: 'var(--font-shadows)' },
    { label: '🔤 Inter (Standard Sans)', value: 'var(--font-inter)' },
  ];

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30">
      {/* Primary Mode: Type vs Draw */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
        <button
          onClick={() => onModeChange('type')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            mode === 'type'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          )}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Type Notes</span>
        </button>

        <button
          onClick={() => onModeChange('handwrite')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            mode === 'handwrite'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          )}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Draw / Stylus</span>
        </button>
      </div>

      {/* Direct Checklist Toggle Button */}
      {mode === 'type' && onToggleChecklist && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleChecklist}
          className="gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold"
          title="Enable/Disable Checkbox on current line"
        >
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          <span>☑ Add Checkbox</span>
        </Button>
      )}

      {/* 3 Colors (Black, Blue, Red) & Custom Handwriting Fonts */}
      <div className="flex items-center gap-3">
        {mode === 'type' && (
          <div className="flex items-center gap-2">
            {/* 3 Color Buttons for Selected Text */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 px-1">Color:</span>
              {textPenColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onApplyTextColor && onApplyTextColor(c.value)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title={`Change selected text color to ${c.label}`}
                >
                  <span className={cn('w-3 h-3 rounded-full', c.dot)} />
                  <span className="text-[11px]">{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Handwriting Font Picker for Selected Text */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Type className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <select
                onChange={(e) => onApplyTextFont && onApplyTextFont(e.target.value)}
                defaultValue="var(--font-kalam)"
                className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {handwritingFonts.map((f) => (
                  <option key={f.label} value={f.value} className="dark:bg-slate-900">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Draw tools */}
        {mode === 'handwrite' && (
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-2">
            <div className="flex items-center gap-1">
              {textPenColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    if (onPenColorChange) onPenColorChange(color.value);
                    if (isEraser && onToggleEraser) onToggleEraser();
                  }}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all cursor-pointer',
                    penColor === color.value && !isEraser
                      ? 'border-slate-900 dark:border-white scale-110 shadow-xs'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>

            {onPenSizeChange && (
              <select
                value={penSize}
                onChange={(e) => onPenSizeChange(Number(e.target.value))}
                className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer font-medium focus:outline-none"
              >
                <option value={2}>Fine (2px)</option>
                <option value={3.5}>Gel Pen (3.5px)</option>
                <option value={5}>Ballpoint (5px)</option>
                <option value={8}>Marker (8px)</option>
              </select>
            )}

            <Button
              variant={isEraser ? 'default' : 'ghost'}
              size="sm"
              onClick={onToggleEraser}
              className={cn(
                'h-7 px-2 text-xs',
                isEraser ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
              )}
            >
              <Eraser className="w-3.5 h-3.5 mr-1" />
              Eraser
            </Button>

            {onClearCanvas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCanvas}
                className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600"
              >
                Clear Ink
              </Button>
            )}
          </div>
        )}

        {/* Global Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            title="Undo"
            className="w-7 h-7"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            title="Redo"
            className="w-7 h-7"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Export Pending Tasks Button */}
        {onExportPendingPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPendingPDF}
            className="gap-1.5 h-8 text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            title="Export only pending tasks to PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pending (PDF)</span>
          </Button>
        )}
      </div>

      {/* Auto-Save Indicator */}
      <div className="flex items-center gap-2 pl-2">
        {saveStatus === 'saving' && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>
    </div>
  );
};
