-- ==============================================================================
-- GOOGLE SHEETS & OAUTH INTEGRATION SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.google_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_email TEXT,
    google_name TEXT,
    google_avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    last_spreadsheet_id TEXT,
    last_spreadsheet_name TEXT,
    last_sheet_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index & RLS
CREATE INDEX IF NOT EXISTS idx_google_connections_user_id ON public.google_connections(user_id);
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own google connection" ON public.google_connections;
CREATE POLICY "Users can view own google connection" ON public.google_connections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own google connection" ON public.google_connections;
CREATE POLICY "Users can insert own google connection" ON public.google_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own google connection" ON public.google_connections;
CREATE POLICY "Users can update own google connection" ON public.google_connections FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own google connection" ON public.google_connections;
CREATE POLICY "Users can delete own google connection" ON public.google_connections FOR DELETE USING (auth.uid() = user_id);
