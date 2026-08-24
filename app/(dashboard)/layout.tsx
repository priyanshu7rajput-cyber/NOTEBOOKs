'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { CreateBookDialog } from '@/components/books/CreateBookDialog';
import { GlobalSearchModal } from '@/components/modals/GlobalSearchModal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { CoverTheme } from '@/types/database';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isDemoMode } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleCreateBook = async (data: {
    title: string;
    purpose: string;
    description: string;
    category: string;
    cover_theme: CoverTheme;
  }) => {
    if (!user && !isDemoMode) return;

    if (!isDemoMode && user) {
      // Real Supabase insert
      const { data: newBook, error: bookError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: data.title,
          purpose: data.purpose,
          description: data.description,
          category: data.category,
          cover_theme: data.cover_theme,
        })
        .select()
        .single();

      if (bookError || !newBook) {
        throw new Error(bookError?.message || 'Failed to create book in database');
      }

      // Create default Page 1
      const { data: newPage } = await supabase
        .from('pages')
        .insert({
          book_id: newBook.id,
          user_id: user.id,
          title: 'Unit 1: Introduction',
          page_number: 1,
        })
        .select()
        .single();

      if (newPage) {
        await supabase
          .from('books')
          .update({ last_opened_page_id: newPage.id })
          .eq('id', newBook.id);
      }

      router.push(`/books/${newBook.id}`);
    } else {
      // Demo Mode local router redirect
      router.push(`/books`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Persistent Left Sidebar */}
      <Sidebar onNewBookClick={() => setIsNewBookOpen(true)} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar onSearchOpen={() => setIsSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          {children}
        </main>
      </div>

      {/* Global Dialogs */}
      <CreateBookDialog
        isOpen={isNewBookOpen}
        onClose={() => setIsNewBookOpen(false)}
        onSubmit={handleCreateBook}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
