'use client';

import React from 'react';
import { JiraAssigneeSummary } from '@/types/jira';
import { Users, User as UserIcon, CheckCircle2, Clock, PlusCircle, AlertCircle } from 'lucide-react';

interface JiraAssigneeSummaryProps {
  assignees: JiraAssigneeSummary[];
  isLoading: boolean;
  selectedAssignee: string;
  onSelectAssignee: (assigneeName: string) => void;
}

export const JiraAssigneeSummaryView: React.FC<JiraAssigneeSummaryProps> = ({
  assignees,
  isLoading,
  selectedAssignee,
  onSelectAssignee,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!assignees || assignees.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Assignee-wise Summary
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            {assignees.length} Team Members
          </span>
        </div>

        {selectedAssignee && selectedAssignee !== 'all' && (
          <button
            onClick={() => onSelectAssignee('all')}
            className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-semibold"
          >
            Clear Assignee Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-2.5 font-semibold">Assignee</th>
              <th className="pb-2.5 font-semibold text-center">New Tasks</th>
              <th className="pb-2.5 font-semibold text-center">Due Today</th>
              <th className="pb-2.5 font-semibold text-center">Completed</th>
              <th className="pb-2.5 font-semibold text-right">Active Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {assignees.map((assignee) => {
              const isSelected = selectedAssignee === assignee.displayName;

              return (
                <tr
                  key={assignee.accountId}
                  onClick={() => onSelectAssignee(isSelected ? 'all' : assignee.displayName)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-violet-50/80 dark:bg-violet-950/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      {assignee.avatarUrl ? (
                        <img
                          src={assignee.avatarUrl}
                          alt={assignee.displayName}
                          className="w-6 h-6 rounded-full ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {assignee.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {assignee.displayName}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                      {assignee.newTasksCount}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                      {assignee.dueTodayCount}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                      {assignee.completedTodayCount}
                    </span>
                  </td>

                  <td className="py-2.5 pl-3 text-right">
                    <span className="inline-flex items-center gap-1 font-extrabold text-slate-700 dark:text-slate-300">
                      {assignee.totalActiveCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
