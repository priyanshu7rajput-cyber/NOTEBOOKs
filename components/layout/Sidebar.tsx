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
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Trash', href: '/trash', icon: Trash2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <BookMarked className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight tracking-tight">
            MyNotebook
          </h1>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
            Digital Ruled Paper
          </span>
        </div>
      </div>

      {/* New Book Quick Button */}
      <div className="p-4">
        <Button
          onClick={onNewBookClick}
          className="w-full justify-center gap-2 shadow-sm font-semibold"
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
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.name}</span>
              </Link>

              {/* Nested Sub-links for Tasks if on tasks route */}
              {item.subItems && pathname.startsWith('/tasks') && (
                <div className="pl-9 pr-2 py-1 space-y-0.5 border-l border-slate-200 dark:border-slate-800 ml-5 my-1">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className="block px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40"
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
