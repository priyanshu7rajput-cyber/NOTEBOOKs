-- ==============================================================================
-- DIGITAL NOTEBOOK & TASK MANAGEMENT - STORAGE BUCKET & RLS POLICIES
-- ==============================================================================

-- 1. Create the private bucket for notebook attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'notebook-attachments', 
    'notebook-attachments', 
    false, 
    26214400, -- 25MB maximum per file
    ARRAY[
        'image/jpeg', 
        'image/png', 
        'image/webp', 
        'image/gif', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 26214400;

-- ==============================================================================
-- 2. POLICIES ON storage.objects
-- Note: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;' is handled by Supabase
-- ==============================================================================

-- SELECT Policy: Users can only read files inside their own folder (folder name is user_id)
DROP POLICY IF EXISTS "Users can read own notebook attachments" ON storage.objects;
CREATE POLICY "Users can read own notebook attachments" 
ON storage.objects FOR SELECT 
TO authenticated
USING (
    bucket_id = 'notebook-attachments' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- INSERT Policy: Users can only upload files into their own folder
DROP POLICY IF EXISTS "Users can upload own notebook attachments" ON storage.objects;
CREATE POLICY "Users can upload own notebook attachments" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
    bucket_id = 'notebook-attachments' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- UPDATE Policy: Users can only update their own files
DROP POLICY IF EXISTS "Users can update own notebook attachments" ON storage.objects;
CREATE POLICY "Users can update own notebook attachments" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
    bucket_id = 'notebook-attachments' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- DELETE Policy: Users can only delete their own files
DROP POLICY IF EXISTS "Users can delete own notebook attachments" ON storage.objects;
CREATE POLICY "Users can delete own notebook attachments" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
    bucket_id = 'notebook-attachments' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);
