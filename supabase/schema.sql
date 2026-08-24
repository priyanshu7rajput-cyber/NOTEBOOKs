-- ==============================================================================
-- DIGITAL NOTEBOOK & TASK MANAGEMENT - SUPABASE DATABASE SCHEMA & RLS
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked with auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    theme_preference TEXT DEFAULT 'system',
    notebook_preferences JSONB DEFAULT '{"line_height": 32, "default_font": "Inter", "default_pen_size": 3, "default_pen_color": "#1e293b", "default_theme": "classic"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. BOOKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    purpose TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    cover_theme TEXT DEFAULT 'classic',
    cover_theme_value TEXT DEFAULT 'classic-slate',
    cover_image_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    last_opened_page_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. PAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Untitled Page',
    page_number INTEGER NOT NULL DEFAULT 1,
    content JSONB DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
    handwriting_data JSONB DEFAULT '{"version":1,"strokes":[]}'::jsonb,
    handwriting_version INTEGER DEFAULT 1,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    last_cursor_position JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TASKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    due_date TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TAGS & TASK_TAGS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.task_tags (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY(task_id, tag_id)
);

-- ==============================================================================
-- 6. ATTACHMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. USER_STATE TABLE (Tracking continue where you left off)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_opened_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    last_opened_page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    last_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    last_cursor_position JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_is_deleted ON public.books(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_books_favorite ON public.books(user_id, is_favorite) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_book_id ON public.pages(book_id);
CREATE INDEX IF NOT EXISTS idx_pages_book_page_num ON public.pages(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_pages_user_is_deleted ON public.pages(user_id, is_deleted);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_book_id ON public.tasks(book_id);
CREATE INDEX IF NOT EXISTS idx_tasks_page_id ON public.tasks(page_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, completed) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_page_id ON public.attachments(page_id);

-- ==============================================================================
-- 9. AUTOMATIC TRIGGER FOR PROFILES & UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_state (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_pages_updated_at ON public.pages;
CREATE TRIGGER set_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent with DROP POLICY IF EXISTS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Books RLS
DROP POLICY IF EXISTS "Users can view own books" ON public.books;
CREATE POLICY "Users can view own books" ON public.books FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
CREATE POLICY "Users can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own books" ON public.books;
CREATE POLICY "Users can update own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
CREATE POLICY "Users can delete own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- Pages RLS
DROP POLICY IF EXISTS "Users can view own pages" ON public.pages;
CREATE POLICY "Users can view own pages" ON public.pages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pages" ON public.pages;
CREATE POLICY "Users can insert own pages" ON public.pages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own pages" ON public.pages;
CREATE POLICY "Users can update own pages" ON public.pages FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pages" ON public.pages;
CREATE POLICY "Users can delete own pages" ON public.pages FOR DELETE USING (auth.uid() = user_id);

-- Tasks RLS
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (book_id IS NULL OR EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND user_id = auth.uid())) AND
    (page_id IS NULL OR EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Tags RLS
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tags" ON public.tags;
CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Task Tags RLS
DROP POLICY IF EXISTS "Users can manage task tags" ON public.task_tags;
CREATE POLICY "Users can manage task tags" ON public.task_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
);

-- Attachments RLS
DROP POLICY IF EXISTS "Users can view own attachments" ON public.attachments;
CREATE POLICY "Users can view own attachments" ON public.attachments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attachments" ON public.attachments;
CREATE POLICY "Users can insert own attachments" ON public.attachments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments" ON public.attachments FOR DELETE USING (auth.uid() = user_id);

-- User State RLS
DROP POLICY IF EXISTS "Users can view own state" ON public.user_state;
CREATE POLICY "Users can view own state" ON public.user_state FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own state" ON public.user_state;
CREATE POLICY "Users can upsert own state" ON public.user_state FOR ALL USING (auth.uid() = user_id);
