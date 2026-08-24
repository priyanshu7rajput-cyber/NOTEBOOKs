'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CoverTheme } from '@/types/database';
import { BOOK_THEMES } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CreateBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    purpose: string;
    description: string;
    category: string;
    cover_theme: CoverTheme;
  }) => Promise<void>;
}

export const CreateBookDialog: React.FC<CreateBookDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Study');
  const [coverTheme, setCoverTheme] = useState<CoverTheme>('classic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Study', 'Work', 'Personal', 'Programming', 'Project', 'Diary', 'Ideas'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Book name is required');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        purpose: purpose.trim(),
        description: description.trim(),
        category,
        cover_theme: coverTheme,
      });
      setTitle('');
      setPurpose('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create notebook. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Digital Notebook"
      description="Customize the cover, category, and purpose for your new notebook."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Book Title */}
        <Input
          label="Book Name *"
          placeholder="e.g. MCA 3rd Semester, React Deep Dive, Daily Journal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          required
        />

        {/* Purpose */}
        <Input
          label="Purpose / Goal"
          placeholder="e.g. Study and Assignments, Sprint Tasks"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer',
                  category === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cover Theme Grid Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Choose Cover Theme
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
            {Object.values(BOOK_THEMES).map((th) => (
              <button
                type="button"
                key={th.id}
                onClick={() => setCoverTheme(th.id)}
                className={cn(
                  'h-16 rounded-xl bg-linear-to-br p-2 relative flex flex-col justify-end text-left border-2 transition-all cursor-pointer',
                  th.gradient,
                  coverTheme === th.id
                    ? 'border-blue-500 ring-2 ring-blue-400/50 scale-[1.02]'
                    : 'border-transparent hover:border-slate-400/50'
                )}
              >
                <div className="absolute top-1.5 right-1.5">
                  {coverTheme === th.id && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/90 truncate drop-shadow-xs">
                  {th.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Book...' : 'Create Notebook'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
