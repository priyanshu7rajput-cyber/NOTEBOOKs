'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Priority } from '@/types/database';
import { cn } from '@/lib/utils';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string | null;
  }) => Promise<void>;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const priorities: { label: string; value: Priority; color: string }[] = [
    { label: '🔴 High', value: 'high', color: 'border-red-500 text-red-600' },
    { label: '🟡 Medium', value: 'medium', color: 'border-amber-500 text-amber-600' },
    { label: '🟢 Low', value: 'low', color: 'border-emerald-500 text-emerald-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a task checklist item with priority and due date."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title *"
          placeholder="e.g. Complete Unit 1 Assignment"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          required
        />

        <Input
          label="Description (Optional)"
          placeholder="Additional notes or checklist details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Priority Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Priority
          </label>
          <div className="grid grid-cols-3 gap-2">
            {priorities.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={cn(
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center',
                  priority === p.value
                    ? `${p.color} bg-slate-100 dark:bg-slate-800 ring-2 ring-blue-500/20`
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
