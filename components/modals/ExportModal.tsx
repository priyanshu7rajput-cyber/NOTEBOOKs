'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Task, Book } from '@/types/database';
import {
  exportTasksToCSV,
  exportTasksToExcel,
  exportTasksToJSON,
  exportTasksToPDF,
} from '@/lib/export/exporter';
import { FileDown, FileSpreadsheet, FileText, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  books?: Book[];
  currentBookId?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  books = [],
  currentBookId,
}) => {
  const [selectedBook, setSelectedBook] = useState<string>(currentBookId || 'all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'xlsx' | 'json'>('csv');

  const filteredTasks = tasks.filter((t) => {
    if (selectedBook !== 'all' && t.book_id !== selectedBook) return false;
    if (statusFilter === 'pending') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    return true;
  });

  const handleExport = () => {
    const filename = `notebook-tasks-${statusFilter}-${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') {
      exportTasksToCSV(filteredTasks, `${filename}.csv`);
    } else if (format === 'xlsx') {
      exportTasksToExcel(filteredTasks, `${filename}.xlsx`);
    } else if (format === 'json') {
      exportTasksToJSON(filteredTasks, `${filename}.json`);
    } else if (format === 'pdf') {
      exportTasksToPDF(filteredTasks, `Task Export (${statusFilter.toUpperCase()})`, `${filename}.pdf`);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Notebook Tasks & Data"
      description="Export your notes or pending tasks in your preferred format."
    >
      <div className="space-y-4">
        {/* Notebook Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Select Notebook
          </label>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Notebooks ({tasks.length} total tasks)</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Task Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pending', label: '🔴 Pending Only' },
              { id: 'completed', label: '🟢 Completed Only' },
              { id: 'all', label: '⚪ All Tasks' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                  statusFilter === s.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Export Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'csv', label: 'CSV', icon: FileText },
              { id: 'xlsx', label: 'Excel (XLSX)', icon: FileSpreadsheet },
              { id: 'pdf', label: 'PDF Report', icon: FileDown },
              { id: 'json', label: 'JSON Data', icon: Download },
            ].map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    format === fmt.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count Preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-400">
          Ready to export <span className="font-bold text-blue-600">{filteredTasks.length}</span> tasks as <span className="font-bold uppercase">{format}</span>.
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={filteredTasks.length === 0} className="gap-1.5">
            <Download className="w-4 h-4" />
            Download Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};
