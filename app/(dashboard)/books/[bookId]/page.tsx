'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Book, Page, Task, HandwritingData } from '@/types/database';
import { RuledPaper } from '@/components/notebook/RuledPaper';
import { NotebookToolbar, NotebookMode } from '@/components/notebook/NotebookToolbar';
import { PageNavigator } from '@/components/notebook/PageNavigator';
import { TiptapEditor, TiptapEditorRef } from '@/components/editor/TiptapEditor';
import { CanvasHandwriting, CanvasHandwritingRef } from '@/components/handwriting/CanvasHandwriting';
import { ExportModal } from '@/components/modals/ExportModal';
import { exportTasksToPDF } from '@/lib/export/exporter';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import Link from 'next/link';

interface BookEditorPageProps {
  params: Promise<{ bookId: string }>;
}

export default function BookEditorPage({ params }: BookEditorPageProps) {
  const { bookId } = use(params);
  const { user, isDemoMode } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [mode, setMode] = useState<NotebookMode>('type');
  const [isChecklistMode, setIsChecklistMode] = useState(false);

  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3.5);
  const [isEraser, setIsEraser] = useState(false);
  const canvasRef = useRef<CanvasHandwritingRef | null>(null);
  const editorRef = useRef<TiptapEditorRef | null>(null);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const supabase = createClient();
  const currentPage = pages.find((p) => p.id === currentPageId) || pages[0];

  const MAX_LINES_PER_PAGE = 18;

  useEffect(() => {
    const loadNotebook = async () => {
      if (isDemoMode || !user) {
        const mockBook: Book = {
          id: bookId,
          user_id: 'demo-user-12345',
          title: 'Class Notebook',
          purpose: 'Handwritten Study Notes',
          description: '',
          category: 'Study',
          cover_theme: 'classic',
          cover_theme_value: 'classic-slate',
          cover_image_url: null,
          is_favorite: true,
          is_deleted: false,
          deleted_at: null,
          last_opened_page_id: 'p1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockPages: Page[] = [
          {
            id: 'p1',
            book_id: bookId,
            user_id: 'demo-user-12345',
            title: 'Welcome Notes',
            page_number: 1,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Hello, I am Raj Chourasiya. Welcome',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'To Our Website Text To Handwriting',
                    },
                  ],
                },
                {
                  type: 'taskList',
                  content: [
                    {
                      type: 'taskItem',
                      attrs: { checked: true },
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Complete Chapter 1 notes' }],
                        },
                      ],
                    },
                    {
                      type: 'taskItem',
                      attrs: { checked: false },
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Solve assignment questions' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            handwriting_data: { version: 1, strokes: [] },
            handwriting_version: 1,
            is_favorite: false,
            is_deleted: false,
            deleted_at: null,
            last_cursor_position: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        setBook(mockBook);
        setPages(mockPages);
        setCurrentPageId(mockPages[0].id);
        return;
      }

      try {
        const { data: bookData } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .eq('user_id', user.id)
          .single();

        if (bookData) setBook(bookData as Book);

        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('page_number', { ascending: true });

        if (pagesData && pagesData.length > 0) {
          setPages(pagesData as Page[]);
          const initialPageId = bookData?.last_opened_page_id || pagesData[0].id;
          setCurrentPageId(initialPageId);
        } else {
          const { data: newP } = await supabase
            .from('pages')
            .insert({
              book_id: bookId,
              user_id: user.id,
              title: 'Page 1',
              page_number: 1,
            })
            .select()
            .single();

          if (newP) {
            setPages([newP as Page]);
            setCurrentPageId(newP.id);
          }
        }

        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .eq('is_deleted', false);

        if (tasksData) setTasks(tasksData as Task[]);
      } catch (err) {
        console.error('Error loading notebook:', err);
      }
    };

    loadNotebook();
  }, [bookId, user, isDemoMode]);

  const triggerAutoSave = (updatedData: {
    content?: any;
    title?: string;
    handwriting_data?: HandwritingData;
  }) => {
    setSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!isDemoMode && user && currentPage) {
        try {
          await supabase
            .from('pages')
            .update({
              ...updatedData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentPage.id)
            .eq('user_id', user.id);

          setSaveStatus('saved');
        } catch (e) {
          setSaveStatus('error');
        }
      } else {
        setTimeout(() => setSaveStatus('saved'), 300);
      }
    }, 600);
  };

  const handleTitleChange = (newTitle: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? { ...p, title: newTitle } : p))
    );
    triggerAutoSave({ title: newTitle });
  };

  const handleEditorChange = (newContent: any) => {
    setPages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? { ...p, content: newContent } : p))
    );
    triggerAutoSave({ content: newContent });
  };

  const handleHandwritingChange = (newHandwriting: HandwritingData) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === currentPage.id ? { ...p, handwriting_data: newHandwriting } : p
      )
    );
    triggerAutoSave({ handwriting_data: newHandwriting });
  };

  const handleAddPage = async () => {
    const nextNum = pages.length + 1;
    if (!isDemoMode && user) {
      const { data: newP } = await supabase
        .from('pages')
        .insert({
          book_id: bookId,
          user_id: user.id,
          title: `Page ${nextNum}`,
          page_number: nextNum,
        })
        .select()
        .single();

      if (newP) {
        setPages((prev) => [...prev, newP as Page]);
        setCurrentPageId(newP.id);
      }
    } else {
      const mockP: Page = {
        id: `p-${Date.now()}`,
        book_id: bookId,
        user_id: 'demo-user-12345',
        title: `Page ${nextNum}`,
        page_number: nextNum,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        handwriting_data: { version: 1, strokes: [] },
        handwriting_version: 1,
        is_favorite: false,
        is_deleted: false,
        deleted_at: null,
        last_cursor_position: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPages((prev) => [...prev, mockP]);
      setCurrentPageId(mockP.id);
    }
  };

  const handlePageLimitReached = () => {
    const currentIndex = pages.findIndex((p) => p.id === currentPageId);
    if (currentIndex < pages.length - 1) {
      setCurrentPageId(pages[currentIndex + 1].id);
    } else {
      handleAddPage();
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((p) => p.id !== pageId);
    setPages(remaining);
    setCurrentPageId(remaining[0].id);

    if (!isDemoMode && user) {
      await supabase
        .from('pages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', pageId)
        .eq('user_id', user.id);
    }
  };

  const handleApplyTextColor = (color: string) => {
    if (editorRef.current) {
      editorRef.current.setColor(color);
    }
  };

  const handleApplyTextFont = (font: string) => {
    if (editorRef.current) {
      editorRef.current.setFont(font);
    }
  };

  const handleToggleChecklist = () => {
    setIsChecklistMode((prev) => !prev);
    if (editorRef.current) {
      editorRef.current.toggleTaskList();
    }
  };

  const handleExportPendingTasksToPDF = () => {
    let pendingList: Task[] = [];

    if (editorRef.current) {
      const liveTasks = editorRef.current.getTasks();
      const editorPending = liveTasks
        .filter((t) => !t.completed)
        .map((t, idx) => ({
          id: `live-${idx}`,
          book_id: bookId,
          page_id: currentPageId,
          user_id: user?.id || 'user',
          title: t.text,
          description: '',
          completed: false,
          priority: 'high' as const,
          due_date: null,
          position: idx,
          is_deleted: false,
          deleted_at: null,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          book_title: book?.title || 'Notebook',
          page_number: currentPage?.page_number || 1,
        }));
      pendingList = editorPending;
    }

    if (pendingList.length === 0 && tasks.length > 0) {
      pendingList = tasks.filter((t) => !t.completed);
    }

    if (pendingList.length === 0) {
      alert('No pending checklist tasks found in this notebook to export.');
      return;
    }

    exportTasksToPDF(
      pendingList,
      `${book?.title || 'Notebook'} - Pending Tasks Report`,
      `${book?.title || 'notebook'}-pending-tasks.pdf`
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/books">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {book?.title || 'Digital Notebook'}
            </h1>
            <p className="text-xs text-slate-500">
              {book?.purpose || 'School / College Copy'} • {pages.length} Pages • {MAX_LINES_PER_PAGE} Lines/Page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPendingTasksToPDF}
            className="gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-50 font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Export Pending PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      {pages.length > 0 && (
        <PageNavigator
          pages={pages}
          currentPageId={currentPageId}
          onSelectPage={setCurrentPageId}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
        />
      )}

      {/* Notebook Toolbar */}
      <NotebookToolbar
        mode={mode}
        onModeChange={setMode}
        penColor={penColor}
        onPenColorChange={setPenColor}
        penSize={penSize}
        onPenSizeChange={setPenSize}
        isEraser={isEraser}
        onToggleEraser={() => setIsEraser(!isEraser)}
        onClearCanvas={() => canvasRef.current?.clear()}
        onApplyTextColor={handleApplyTextColor}
        onApplyTextFont={handleApplyTextFont}
        onToggleChecklist={handleToggleChecklist}
        onExportPendingPDF={handleExportPendingTasksToPDF}
        onUndo={() => {
          if (mode === 'handwrite') canvasRef.current?.undo();
          else editorRef.current?.undo();
        }}
        onRedo={() => {
          if (mode === 'handwrite') canvasRef.current?.redo();
          else editorRef.current?.redo();
        }}
        saveStatus={saveStatus}
      />

      {/* The Physical Ruled Paper Visual Page with Top Heading */}
      {currentPage && (
        <RuledPaper
          key={currentPage.id}
          pageNumber={currentPage.page_number}
          headerTitle={currentPage.title}
          onHeaderTitleChange={handleTitleChange}
          headerDate={new Date(currentPage.created_at).toLocaleDateString('en-GB')}
        >
          <div
            className="relative w-full"
            style={{ height: `${MAX_LINES_PER_PAGE * 44}px` }}
          >
            {/* Tiptap Typing Surface */}
            <div className={mode === 'handwrite' ? 'pointer-events-none opacity-80' : ''}>
              <TiptapEditor
                ref={editorRef}
                initialContent={currentPage.content}
                onChange={handleEditorChange}
                isChecklistModeAlways={isChecklistMode}
                maxLinesPerPage={MAX_LINES_PER_PAGE}
                onPageLimitReached={handlePageLimitReached}
              />
            </div>

            {/* Canvas Handwriting Overlay */}
            {mode === 'handwrite' && (
              <CanvasHandwriting
                ref={canvasRef}
                initialData={currentPage.handwriting_data}
                onChange={handleHandwritingChange}
                penColor={penColor}
                penSize={penSize}
                isEraser={isEraser}
              />
            )}
          </div>
        </RuledPaper>
      )}

      {/* Export Dialog */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tasks={tasks}
        currentBookId={bookId}
      />
    </div>
  );
}
