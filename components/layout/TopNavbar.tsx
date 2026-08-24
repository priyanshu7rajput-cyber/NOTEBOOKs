'use client';

import React from 'react';
import { Search, Sun, Moon, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';

interface TopNavbarProps {
  onSearchOpen?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onSearchOpen }) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, profile, isDemoMode, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-xs cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search notebooks, pages, tasks, or tags...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right tools: Demo banner, Theme toggle, User Profile & Logout */}
      <div className="flex items-center gap-3">
        {isDemoMode && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Demo Mode (Connect Supabase)</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="text-slate-600 dark:text-slate-400"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* User profile dropdown / logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {profile?.name || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {user?.email || 'authenticated'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sign out"
            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
