'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Book, Task, Page, UserState } from '@/types/database';
import { BookCard } from '@/components/books/BookCard';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  CheckSquare,
  Clock,
  ArrowRight,
  Sparkles,
  BookMarked,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, isDemoMode } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Mock initial books for demo fallback
  const demoBooks: Book[] = [
    {
      id: 'demo-b1',
      user_id: 'demo-user-12345',
      title: 'Computer Science Notes',
      purpose: 'Study and Assignments',
      description: 'Computer graphics, algorithms, and semester projects',
      category: 'Education',
      cover_theme: 'classic',
      cover_theme_value: 'classic-slate',
      cover_image_url: null,
      is_favorite: true,
      is_deleted: false,
      deleted_at: null,
      last_opened_page_id: 'demo-p1',
      page_count: 24,
      total_tasks: 80,
      completed_tasks: 52,
      pending_tasks: 28,
      progress_percentage: 65,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-b2',
      user_id: 'demo-user-12345',
      title: 'Full Stack Project Tracker',
      purpose: 'Design & Code Architecture',
      description: 'Next.js, Supabase, and RLS implementation notes',
      category: 'Programming',
      cover_theme: 'code',
      cover_theme_value: 'code-term',
      cover_image_url: null,
      is_favorite: false,
      is_deleted: false,
      deleted_at: null,
      last_opened_page_id: 'demo-p2',
      page_count: 14,
      total_tasks: 25,
      completed_tasks: 18,
      pending_tasks: 7,
      progress_percentage: 72,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-b3',
      user_id: 'demo-user-12345',
      title: 'Personal Journal & Ideas',
      purpose: 'Daily Reflections',
      description: 'Thoughts, morning routines, and weekly reviews',
      category: 'Personal',
      cover_theme: 'gradient',
      cover_theme_value: 'grad-aurora',
      cover_image_url: null,
      is_favorite: true,
      is_deleted: false,
      deleted_at: null,
      last_opened_page_id: 'demo-p3',
      page_count: 8,
      total_tasks: 10,
      completed_tasks: 9,
      pending_tasks: 1,
      progress_percentage: 90,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const demoTasks: Task[] = [
    {
      id: 'demo-t1',
      book_id: 'demo-b1',
      page_id: 'demo-p1',
      user_id: 'demo-user-12345',
      title: 'Complete Unit 3 Computer Graphics assignment',
      description: 'Solve Ray Tracing algorithm derivations',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      position: 0,
      is_deleted: false,
      deleted_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      book_title: 'Computer Science Notes',
      page_number: 12,
    },
    {
      id: 'demo-t2',
      book_id: 'demo-b2',
      page_id: 'demo-p2',
      user_id: 'demo-user-12345',
      title: 'Implement Supabase RLS policies and storage tests',
      description: 'Ensure cross-user isolation is 100% verified',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 172800000).toISOString(),
      position: 1,
      is_deleted: false,
      deleted_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      book_title: 'Full Stack Project Tracker',
      page_number: 7,
    },
    {
      id: 'demo-t3',
      book_id: 'demo-b1',
      page_id: 'demo-p1',
      user_id: 'demo-user-12345',
      title: 'Review Chapter 4 Data Structures notes',
      description: 'B-Trees and AVL rotations',
      completed: false,
      priority: 'medium',
      due_date: new Date(Date.now() + 259200000).toISOString(),
      position: 2,
      is_deleted: false,
      deleted_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      book_title: 'Computer Science Notes',
      page_number: 5,
    },
  ];

  const fetchDashboardData = async () => {
    if (isDemoMode || !user) {
      setBooks(demoBooks);
      setPendingTasks(demoTasks);
      setStats({
        totalBooks: demoBooks.length,
        totalPages: 46,
        pendingTasks: 36,
        completedTasks: 79,
      });
      setUserState({
        user_id: 'demo-user-12345',
        last_opened_book_id: demoBooks[0].id,
        last_opened_page_id: demoBooks[0].last_opened_page_id,
        last_task_id: demoTasks[0].id,
        last_cursor_position: null,
        updated_at: new Date().toISOString(),
        book: demoBooks[0],
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch User Books
      const { data: dbBooks } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      // 2. Fetch User Tasks
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*, books(title), pages(page_number)')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      const allTasks: Task[] = (dbTasks || []).map((t: any) => ({
        ...t,
        book_title: t.books?.title,
        page_number: t.pages?.page_number,
      }));

      const pending = allTasks.filter((t) => !t.completed);
      const completed = allTasks.filter((t) => t.completed);

      // Compute per-book counts
      const enrichedBooks = (dbBooks || []).map((b) => {
        const bTasks = allTasks.filter((t) => t.book_id === b.id);
        const bDone = bTasks.filter((t) => t.completed).length;
        const bTotal = bTasks.length;
        return {
          ...b,
          total_tasks: bTotal,
          completed_tasks: bDone,
          pending_tasks: bTotal - bDone,
          progress_percentage: bTotal > 0 ? Math.round((bDone / bTotal) * 100) : 0,
        };
      });

      setBooks(enrichedBooks);
      setPendingTasks(pending.slice(0, 5));
      setStats({
        totalBooks: enrichedBooks.length,
        totalPages: enrichedBooks.length * 3, // estimation or query
        pendingTasks: pending.length,
        completedTasks: completed.length,
      });

      // 3. User State for continue where you left off
      const { data: stateData } = await supabase
        .from('user_state')
        .select('*, books(title)')
        .eq('user_id', user.id)
        .single();

      if (stateData && stateData.last_opened_book_id) {
        setUserState(stateData as any);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, isDemoMode]);

  const handleDeleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (!isDemoMode && user) {
      await supabase
        .from('books')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', bookId)
        .eq('user_id', user.id);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    // Optimistic UI update
    setPendingTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed,
              completed_at: completed ? new Date().toISOString() : null,
            }
          : t
      )
    );

    if (!isDemoMode && user) {
      await supabase
        .from('tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .eq('user_id', user.id);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Greeting & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {profile?.name || 'Scholar'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome to your digital notebook workspace. Here is your overview for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tasks">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CheckSquare className="w-4 h-4" />
              Task Dashboard
            </Button>
          </Link>
          <Link href="/books">
            <Button size="sm" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              All Notebooks
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-violet-300 dark:hover:border-violet-800 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Notebooks</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {stats.totalBooks}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 block">Active digital copies</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pages</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {stats.totalPages}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 block">Ruled & handwritten pages</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-pink-300 dark:hover:border-pink-800 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-pink-600 dark:text-pink-400 mt-3">
            {stats.pendingTasks}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 block">Action items remaining</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-3">
            {stats.completedTasks}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 block">Successfully finished</span>
        </div>
      </div>

      {/* Continue Where You Left Off Hero Widget - Sunset Violet to Magenta Neon Gradient */}
      {userState && userState.last_opened_book_id && (
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 rounded-3xl p-7 text-white shadow-xl shadow-purple-500/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Continue Where You Left Off</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black drop-shadow-xs">
              {books.find((b) => b.id === userState.last_opened_book_id)?.title ||
                'Recent Notebook'}
            </h3>
            <p className="text-xs sm:text-sm text-purple-100">
              Pick up right from your last edited page with cursor and checklist position saved.
            </p>
          </div>

          <Link
            href={`/books/${userState.last_opened_book_id}`}
            className="z-10 shrink-0"
          >
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-violet-900 hover:bg-violet-50 font-bold shadow-lg border-0"
            >
              Continue Writing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Notebooks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Notebooks
            </h2>
            <p className="text-xs text-slate-500">Your most recently updated notebooks</p>
          </div>
          <Link
            href="/books"
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
          >
            <span>View all notebooks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.slice(0, 3).map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDeleteBook} />
          ))}
        </div>
      </div>

      {/* Pending Tasks Quick List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pending Tasks
            </h2>
            <p className="text-xs text-slate-500">Urgent checklist items across all your notebooks</p>
          </div>
          <Link
            href="/tasks"
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
          >
            <span>Open Task Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {pendingTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
              All caught up! No pending tasks at the moment.
            </div>
          ) : (
            pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                showLocation={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
