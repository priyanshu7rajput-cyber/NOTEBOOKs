'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { JiraConfigSection } from '@/components/jira/JiraConfigSection';
import { downloadJSON } from '@/lib/export/exporter';
import {
  User,
  Moon,
  Sun,
  Shield,
  Database,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCode,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, isDemoMode, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  // Backup & Restore states
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  const handleDownloadBackup = async () => {
    setIsExportingBackup(true);
    setBackupMessage(null);
    try {
      let booksData: any[] = [];
      let pagesData: any[] = [];
      let tasksData: any[] = [];

      if (!isDemoMode && user) {
        const [booksRes, pagesRes, tasksRes] = await Promise.all([
          supabase.from('books').select('*').eq('user_id', user.id).eq('is_deleted', false),
          supabase.from('pages').select('*').eq('user_id', user.id).eq('is_deleted', false),
          supabase.from('tasks').select('*').eq('user_id', user.id).eq('is_deleted', false),
        ]);
        booksData = booksRes.data || [];
        pagesData = pagesRes.data || [];
        tasksData = tasksRes.data || [];
      }

      // If database is empty or demo mode, export active notebook, pages, and tasks
      if (booksData.length === 0) {
        booksData = [
          {
            id: 'b1',
            title: 'Class Notebook',
            purpose: 'Handwritten Study Notes',
            category: 'Study',
            cover_theme: 'classic',
            cover_theme_value: 'classic-slate',
            is_favorite: true,
            created_at: new Date().toISOString(),
          },
        ];
        pagesData = [
          {
            id: 'p1',
            book_id: 'b1',
            title: 'Welcome Notes',
            page_number: 1,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'hello i am priyanshu' }],
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ];
        tasksData = [
          {
            id: 't1',
            book_id: 'b1',
            title: 'Complete Chapter 1 notes',
            completed: true,
            priority: 'medium',
            created_at: new Date().toISOString(),
          },
          {
            id: 't2',
            book_id: 'b1',
            title: 'Solve assignment questions',
            completed: false,
            priority: 'high',
            created_at: new Date().toISOString(),
          },
        ];
      }

      const backupPayload = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'MyNotebook',
        type: 'full_system_backup',
        user: {
          id: user?.id || 'demo-user',
          email: user?.email || 'demo@mynotebook.app',
          name: name || profile?.name || 'Notebook User',
        },
        counts: {
          books: booksData.length,
          pages: pagesData.length,
          tasks: tasksData.length,
        },
        data: {
          books: booksData,
          pages: pagesData,
          tasks: tasksData,
        },
      };

      const dateTag = new Date().toISOString().split('T')[0];
      downloadJSON(backupPayload, `mynotebook-full-backup-${dateTag}.json`);
      setBackupMessage({
        type: 'success',
        text: `Data backup JSON downloaded successfully (${booksData.length} notebooks, ${pagesData.length} pages, ${tasksData.length} tasks).`,
      });
    } catch (err: any) {
      console.error('Backup error:', err);
      setBackupMessage({ type: 'error', text: err.message || 'Failed to generate backup JSON.' });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoringBackup(true);
    setBackupMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const books = parsed.data?.books || parsed.books || [];
      const pages = parsed.data?.pages || parsed.pages || [];
      const tasks = parsed.data?.tasks || parsed.tasks || [];

      if (!Array.isArray(books) && !Array.isArray(tasks) && !Array.isArray(pages)) {
        throw new Error('Invalid backup file structure. Expected JSON with books, pages, or tasks.');
      }

      if (!isDemoMode && user) {
        if (books.length > 0) {
          await supabase.from('books').upsert(books.map((b: any) => ({ ...b, user_id: user.id })));
        }
        if (pages.length > 0) {
          await supabase.from('pages').upsert(pages.map((p: any) => ({ ...p, user_id: user.id })));
        }
        if (tasks.length > 0) {
          await supabase.from('tasks').upsert(tasks.map((t: any) => ({ ...t, user_id: user.id })));
        }
      }

      setBackupMessage({
        type: 'success',
        text: `Restored successfully! Loaded ${books.length} notebooks, ${pages.length} pages, and ${tasks.length} tasks from JSON.`,
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      setBackupMessage({ type: 'error', text: err.message || 'Failed to restore JSON backup file.' });
    } finally {
      setIsRestoringBackup(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
            Data Management & Backup
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Create an offline backup copy of all your notebooks, written pages, notes, checklists, and tasks. You can also restore your data anytime by uploading a previous JSON backup file.
          </p>

          {backupMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-2xl text-xs ${
                backupMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBackup}
              disabled={isExportingBackup}
              className="gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isExportingBackup ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Download className="w-4 h-4 text-emerald-500" />
              )}
              <span>{isExportingBackup ? 'Generating Backup...' : 'Download All Data (Backup JSON)'}</span>
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleRestoreBackupFile}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoringBackup}
              className="gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isRestoringBackup ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Upload className="w-4 h-4 text-blue-500" />
              )}
              <span>{isRestoringBackup ? 'Restoring...' : 'Restore from Backup JSON'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
