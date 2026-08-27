'use client';

import React from 'react';
import { JiraDashboardSummary } from '@/types/jira';
import { PlusCircle, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';

interface JiraSummaryCardsProps {
  summary: JiraDashboardSummary | null;
  isLoading: boolean;
  activeTab: string;
  onTabSelect: (tab: 'all' | 'new' | 'due' | 'completed') => void;
}

export const JiraSummaryCards: React.FC<JiraSummaryCardsProps> = ({
  summary,
  isLoading,
  activeTab,
  onTabSelect,
}) => {
  const cards = [
    {
      id: 'new',
      title: "Today's New Tasks",
      count: summary?.newTasksCount ?? 0,
      icon: PlusCircle,
      gradient: 'from-indigo-500/10 to-blue-500/10',
      border: 'hover:border-indigo-500/50',
      activeBorder: 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-sm shadow-indigo-500/10',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      countColor: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Created Today',
    },
    {
      id: 'due',
      title: "Today's Due Tasks",
      count: summary?.dueTodayCount ?? 0,
      icon: CalendarClock,
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      countColor: 'text-amber-600 dark:text-amber-400',
      badge: 'Due Date: Today',
    },
    {
      id: 'completed',
      title: "Completed Today",
      count: summary?.completedTodayCount ?? 0,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'hover:border-emerald-500/50',
      activeBorder: 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      countColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'Resolved Today',
    },
    {
      id: 'pending-due',
      title: "Pending Due Today",
      count: summary?.pendingDueTodayCount ?? 0,
      icon: AlertCircle,
      gradient: 'from-rose-500/10 to-pink-500/10',
      border: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      countColor: 'text-rose-600 dark:text-rose-400',
      badge: 'Action Needed',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.id === 'new' && activeTab === 'new') ||
          (card.id === 'due' && activeTab === 'due') ||
          (card.id === 'completed' && activeTab === 'completed') ||
          (card.id === 'pending-due' && activeTab === 'due');

        return (
          <div
            key={card.id}
            onClick={() => {
              if (card.id === 'new') onTabSelect('new');
              else if (card.id === 'due' || card.id === 'pending-due') onTabSelect('due');
              else if (card.id === 'completed') onTabSelect('completed');
            }}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              isSelected
                ? card.activeBorder
                : `border-slate-200/80 dark:border-slate-800/80 ${card.border}`
            } shadow-2xs hover:shadow-md group`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {card.badge}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {card.title}
              </span>

              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-1" />
              ) : (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.countColor}`}>
                    {card.count}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">tasks</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
