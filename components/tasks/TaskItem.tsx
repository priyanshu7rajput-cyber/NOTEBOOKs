'use client';

import React from 'react';
import { Task, Priority } from '@/types/database';
import { Check, Clock, Calendar, Tag, Trash2, ArrowUpRight } from 'lucide-react';
import { cn, formatDate, getPriorityColor } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete?: (taskId: string) => void;
  onNavigate?: (bookId: string, pageId: string, taskId: string) => void;
  showLocation?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onNavigate,
  showLocation = false,
}) => {
  const priorityStyle = getPriorityColor(task.priority);

  return (
    <div
      className={cn(
        'group flex items-start justify-between p-3.5 rounded-xl border transition-all duration-200',
        task.completed
          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-75'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Optimistic Checkbox */}
        <button
          onClick={() => onToggle(task.id, !task.completed)}
          className={cn(
            'w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0',
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
          )}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-slate-900 dark:text-slate-100 transition-all leading-snug break-words',
              task.completed && 'line-through text-slate-400 dark:text-slate-500'
            )}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges: Priority, Due Date, Location */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priority Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                priorityStyle.bg
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', priorityStyle.dot)} />
              {priorityStyle.label}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDate(task.due_date)}
              </span>
            )}

            {/* Notebook Location link */}
            {showLocation && task.book_id && task.page_id && onNavigate && (
              <button
                onClick={() => onNavigate(task.book_id!, task.page_id!, task.id)}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                <span>
                  {task.book_title || 'Book'} • Page {task.page_number || 1}
                </span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete task button */}
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity p-1 rounded-md ml-2"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
