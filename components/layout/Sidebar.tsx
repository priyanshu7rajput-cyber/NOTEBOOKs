'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Star,
  Trash2,
  Settings,
  Plus,
  BookMarked,
  FileSpreadsheet,
  Table2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  onNewBookClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewBookClick }) => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Books', href: '/books', icon: BookOpen },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      subItems: [
        { name: 'All Tasks', href: '/tasks?filter=all' },
        { name: 'Pending', href: '/tasks?filter=pending' },
        { name: 'Completed', href: '/tasks?filter=completed' },
        { name: 'Due Today', href: '/tasks?filter=today' },
        { name: 'Overdue', href: '/tasks?filter=overdue' },
      ],
    },
    { name: 'Daily Task Report', href: '/daily-report', icon: FileSpreadsheet },
    { name: 'Google Sheets', href: '/google-sheets', icon: Table2 },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Trash', href: '/trash', icon: Trash2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
          <BookMarked className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight tracking-tight">
            MyNotebook
          </h1>
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
            Digital Ruled Paper
          </span>
        </div>
      </div>

      {/* New Book Quick Button */}
      <div className="p-4">
        <Button
          onClick={onNewBookClick}
          className="w-full justify-center gap-2 shadow-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-indigo-500/20 hover:shadow-indigo-500/30"
          size="md"
        >
          <Plus className="w-4 h-4" />
          Create New Book
        </Button>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <div key={item.name} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.name}</span>
              </Link>

              {/* Nested Sub-links for Tasks if on tasks route */}
              {item.subItems && pathname.startsWith('/tasks') && (
                <div className="pl-9 pr-2 py-1 space-y-0.5 border-l border-violet-200 dark:border-violet-800/60 ml-5 my-1">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className="block px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 rounded-lg hover:bg-violet-50/50 dark:hover:bg-violet-950/30"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
