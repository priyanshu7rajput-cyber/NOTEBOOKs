'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { parseTasksFile, ValidatedImportTask } from '@/lib/import/importer';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Book } from '@/types/database';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onImportSuccess: (tasks: ValidatedImportTask[], bookId: string) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  books,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ValidatedImportTask[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setIsProcessing(true);
    try {
      const result = await parseTasksFile(selected);
      setParsedTasks(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse file.');
      setParsedTasks([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedTasks.length === 0) return;
    setIsProcessing(true);
    try {
      await onImportSuccess(parsedTasks, selectedBookId);
      setFile(null);
      setParsedTasks([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Import failed to save.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Tasks & Checklists"
      description="Upload CSV, Excel (XLSX), or JSON file with tasks."
    >
      <div className="space-y-4">
        {/* Destination Book */}
        {books.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Assign to Notebook
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drag & Drop / File Input Box */}
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-900/50 transition-all">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {file ? file.name : 'Click to select CSV, Excel, or JSON'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Supports .csv, .xlsx, .json</span>
          <input
            type="file"
            accept=".csv, .xlsx, .xls, .json"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {parsedTasks.length > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Validated {parsedTasks.length} tasks ready to import</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleImportSubmit}
            disabled={parsedTasks.length === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Import'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
