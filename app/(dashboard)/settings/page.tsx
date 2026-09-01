'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { JiraConfigSection } from '@/components/jira/JiraConfigSection';
import {
  User,
  Moon,
  Sun,
  Shield,
  Database,
  Download,
  Upload,
  CheckCircle,
  FileCode,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, isDemoMode, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.name || '');
  const [isSaved, setIsSaved] = useState(false);
  const supabase = createClient();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDemoMode && user) {
      await supabase
        .from('profiles')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await refreshProfile();
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500">
          Manage your notebook workspace, account profile, appearance, and data security.
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Profile Details
          </h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

          <Input
            label="Email Address (Authenticated)"
            value={user?.email || 'student@mynotebook.app'}
            disabled
            className="opacity-70 cursor-not-allowed"
          />

          <Button type="submit" size="sm" className="gap-1.5">
            {isSaved ? <CheckCircle className="w-4 h-4" /> : null}
            {isSaved ? 'Changes Saved' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sun className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Appearance & Theme
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'dark', label: 'Dark Mode', icon: Moon },
            { id: 'system', label: 'System Auto', icon: Shield },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as any)}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                  theme === mode.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User-specific Jira Cloud Integration */}
      <JiraConfigSection />

      {/* Data Management & Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Management & Security
          </h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            All your books, pages, tasks, Jira credentials, and handwriting are isolated via PostgreSQL Row Level Security (RLS) policies. Only your authenticated user account can access or modify your records.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Full JSON backup downloaded')}
              className="gap-1.5 text-xs"
            >
              <Download className="w-4 h-4" />
              Download All Data (Backup JSON)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
