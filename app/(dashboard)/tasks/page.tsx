'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Task, Priority, Book } from '@/types/database';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { ImportModal } from '@/components/modals/ImportModal';
import { Button } from '@/components/ui/Button';
import {
  CheckSquare,
  Plus,
  Filter,
  Download,
  Upload,
  Calendar,
  AlertCircle,
  Clock,
  ListTodo,
  Loader2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function TasksContent() {
  const { user, isDemoMode } = useAuth();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const fetchTasks = async () => {
    if (isDemoMode || !user) {
      const mockTasks: Task[] = [
        {
          id: 't1',
          book_id: 'demo-b1',
          page_id: 'p1',
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
          id: 't2',
          book_id: 'demo-b2',
          page_id: 'p2',
          user_id: 'demo-user-12345',
          title: 'Implement Supabase RLS policies and storage tests',
          description: 'Ensure cross-user isolation is 100% verified',
          completed: false,
          priority: 'high',
          due_date: new Date().toISOString(),
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
          id: 't3',
          book_id: 'demo-b1',
          page_id: 'p1',
          user_id: 'demo-user-12345',
          title: 'Review Chapter 4 Data Structures notes',
          description: 'B-Trees and AVL rotations',
          completed: true,
          priority: 'medium',
          due_date: new Date(Date.now() - 86400000).toISOString(),
          position: 2,
          is_deleted: false,
          deleted_at: null,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          book_title: 'Computer Science Notes',
          page_number: 5,
        },
      ];

      setTasks(mockTasks);
      setBooks([
        {
          id: 'demo-b1',
          user_id: 'demo-user-12345',
          title: 'Computer Science Notes',
          purpose: 'Study',
          description: '',
          category: 'Education',
          cover_theme: 'classic',
          cover_theme_value: 'classic-slate',
          cover_image_url: null,
          is_favorite: true,
          is_deleted: false,
          deleted_at: null,
          last_opened_page_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*, books(title), pages(page_number)')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      const { data: dbBooks } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (dbTasks) {
        setTasks(
          dbTasks.map((t: any) => ({
            ...t,
            book_title: t.books?.title,
            page_number: t.pages?.page_number,
          }))
        );
      }

      if (dbBooks) {
        setBooks(dbBooks as Book[]);
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, isDemoMode]);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    setTasks((prev) =>
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

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (!isDemoMode && user) {
      await supabase
        .from('tasks')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id);
    }
  };

  const handleNavigateToTask = (bookId: string, pageId: string, taskId: string) => {
    router.push(`/books/${bookId}?page=${pageId}&task=${taskId}`);
  };

  const filteredTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    const taskDue = t.due_date ? t.due_date.split('T')[0] : null;

    if (activeFilter === 'pending' && t.completed) return false;
    if (activeFilter === 'completed' && !t.completed) return false;
    if (activeFilter === 'today' && taskDue !== today) return false;
    if (activeFilter === 'overdue' && (!taskDue || taskDue >= today || t.completed)) return false;
    if (activeFilter === 'high' && t.priority !== 'high') return false;

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    return true;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    today: tasks.filter(
      (t) => !t.completed && t.due_date && t.due_date.split('T')[0] === new Date().toISOString().split('T')[0]
    ).length,
    overdue: tasks.filter(
      (t) => !t.completed && t.due_date && t.due_date.split('T')[0] < new Date().toISOString().split('T')[0]
    ).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Task Management Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Track checklists, deadlines, and action items synced directly with your notebook pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task Filters Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all', label: 'All Tasks', count: counts.all, icon: ListTodo },
            { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
            { id: 'completed', label: 'Completed', count: counts.completed, icon: CheckSquare },
            { id: 'today', label: 'Due Today', count: counts.today, icon: Calendar },
            { id: 'overdue', label: 'Overdue', count: counts.overdue, icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeFilter === tab.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 pr-2">
          <span className="text-xs text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Task Items List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
            No tasks found in this section.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onNavigate={handleNavigateToTask}
              showLocation={true}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          if (!isDemoMode && user) {
            const { data: newT } = await supabase
              .from('tasks')
              .insert({
                user_id: user.id,
                title: data.title,
                description: data.description,
                priority: data.priority,
                due_date: data.due_date,
              })
              .select()
              .single();

            if (newT) setTasks((prev) => [newT as Task, ...prev]);
          } else {
            const mockT: Task = {
              id: `t-${Date.now()}`,
              book_id: null,
              page_id: null,
              user_id: 'demo-user-12345',
              title: data.title,
              description: data.description,
              completed: false,
              priority: data.priority,
              due_date: data.due_date,
              position: tasks.length,
              is_deleted: false,
              deleted_at: null,
              completed_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setTasks((prev) => [mockT, ...prev]);
          }
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tasks={tasks}
        books={books}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        books={books}
        onImportSuccess={async (importedTasks, bookId) => {
          if (!isDemoMode && user) {
            const records = importedTasks.map((t, idx) => ({
              user_id: user.id,
              book_id: bookId || null,
              title: t.title,
              description: t.description,
              priority: t.priority,
              position: idx,
            }));

            const { data } = await supabase.from('tasks').insert(records).select();
            if (data) setTasks((prev) => [...(data as Task[]), ...prev]);
          } else {
            const mockImported: Task[] = importedTasks.map((t, idx) => ({
              id: `t-imp-${Date.now()}-${idx}`,
              book_id: bookId || null,
              page_id: null,
              user_id: 'demo-user-12345',
              title: t.title,
              description: t.description,
              completed: false,
              priority: t.priority,
              due_date: null,
              position: idx,
              is_deleted: false,
              deleted_at: null,
              completed_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            setTasks((prev) => [...mockImported, ...prev]);
          }
        }}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading tasks...</span>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
