'use client';

import React from 'react';
import { JiraIssue } from '@/types/jira';
import { formatDate } from '@/lib/utils';
import {
  ExternalLink,
  Bug,
  CheckSquare,
  Bookmark,
  GitPullRequest,
  Clock,
  Calendar,
  AlertCircle,
  Inbox,
  User as UserIcon,
} from 'lucide-react';

interface JiraTaskTableProps {
  tasks: JiraIssue[];
  isLoading: boolean;
  emptyMessage?: string;
}

export const JiraTaskTable: React.FC<JiraTaskTableProps> = ({
  tasks,
  isLoading,
  emptyMessage = "No tasks found for today's criteria.",
}) => {
  // Helpers for issue type icon
  const getIssueTypeIcon = (typeName: string) => {
    const lower = typeName.toLowerCase();
    if (lower.includes('bug')) return <Bug className="w-3.5 h-3.5 text-rose-500" />;
    if (lower.includes('story')) return <Bookmark className="w-3.5 h-3.5 text-emerald-500" />;
    if (lower.includes('sub')) return <GitPullRequest className="w-3.5 h-3.5 text-sky-500" />;
    return <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />;
  };

  // Status Category Color Badge
  const getStatusBadge = (status: JiraIssue['status']) => {
    const cat = status.statusCategory;
    if (cat === 'done') {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
    if (cat === 'indeterminate') {
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
  };

  // Priority Color
  const getPriorityBadge = (priorityName: string) => {
    const lower = priorityName.toLowerCase();
    if (lower.includes('high') || lower.includes('highest') || lower.includes('critical') || lower.includes('blocker')) {
      return 'text-rose-600 dark:text-rose-400 font-bold';
    }
    if (lower.includes('medium')) {
      return 'text-amber-600 dark:text-amber-400 font-semibold';
    }
    return 'text-slate-500 dark:text-slate-400';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Tasks to Display
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Key</th>
              <th className="py-3 px-4">Task Title</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => {
              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Key */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline group-hover:text-indigo-500"
                      title="Open in Jira"
                    >
                      <span>{task.key}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </a>
                  </td>

                  {/* Task Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span title={task.issueType.name}>
                        {task.issueType.iconUrl ? (
                          <img src={task.issueType.iconUrl} alt={task.issueType.name} className="w-3.5 h-3.5" />
                        ) : (
                          getIssueTypeIcon(task.issueType.name)
                        )}
                      </span>
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 max-w-md"
                        title={task.summary}
                      >
                        {task.summary}
                      </a>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {task.assignee?.avatarUrl ? (
                        <img
                          src={task.assignee.avatarUrl}
                          alt={task.assignee.displayName}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {task.assignee ? task.assignee.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {task.assignee ? task.assignee.displayName : <span className="text-slate-400 italic">Unassigned</span>}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(task.status)}`}>
                      {task.status.name}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[11px] ${getPriorityBadge(task.priority.name)}`}>
                      {task.priority.name}
                    </span>
                  </td>

                  {/* Project */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {task.project.key}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {formatDate(task.created)}
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                    {task.dueDate ? (
                      <span className={task.dueDate.startsWith(new Date().toISOString().split('T')[0]) ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs"
              >
                <span>{task.key}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(task.status)}`}>
                {task.status.name}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {task.summary}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {task.assignee ? task.assignee.displayName : 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={getPriorityBadge(task.priority.name)}>{task.priority.name}</span>
                {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
