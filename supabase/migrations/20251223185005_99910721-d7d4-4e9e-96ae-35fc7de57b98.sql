-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on music_library" ON public.music_library;
DROP POLICY IF EXISTS "Allow all operations on listening_events" ON public.listening_events;
DROP POLICY IF EXISTS "Allow all operations on taste_snapshots" ON public.taste_snapshots;

-- Create restrictive policies that deny all direct client access
-- Service role key (used by Edge Function) bypasses RLS, so this is secure

CREATE POLICY "Deny all direct access" 
ON public.music_library 
FOR ALL 
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all direct access" 
ON public.listening_events 
FOR ALL 
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all direct access" 
ON public.taste_snapshots 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Add unique constraint for upsert operations (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'music_library_track_user_unique'
    ) THEN
        ALTER TABLE public.music_library 
        ADD CONSTRAINT music_library_track_user_unique 
        UNIQUE (track_id, user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'taste_snapshots_user_date_unique'
    ) THEN
        ALTER TABLE public.taste_snapshots 
        ADD CONSTRAINT taste_snapshots_user_date_unique 
        UNIQUE (user_id, snapshot_date);
    END IF;
END $$;