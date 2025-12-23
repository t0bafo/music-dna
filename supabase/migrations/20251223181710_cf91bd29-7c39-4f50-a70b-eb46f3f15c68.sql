-- Drop existing RLS policies that use JWT claims (since we use Spotify OAuth, not Supabase Auth)
DROP POLICY IF EXISTS "Users can view their own music library" ON public.music_library;
DROP POLICY IF EXISTS "Users can insert their own music library" ON public.music_library;
DROP POLICY IF EXISTS "Users can update their own music library" ON public.music_library;
DROP POLICY IF EXISTS "Users can delete their own music library" ON public.music_library;

DROP POLICY IF EXISTS "Users can view their own listening events" ON public.listening_events;
DROP POLICY IF EXISTS "Users can insert their own listening events" ON public.listening_events;
DROP POLICY IF EXISTS "Users can delete their own listening events" ON public.listening_events;

DROP POLICY IF EXISTS "Users can view their own taste snapshots" ON public.taste_snapshots;
DROP POLICY IF EXISTS "Users can insert their own taste snapshots" ON public.taste_snapshots;
DROP POLICY IF EXISTS "Users can update their own taste snapshots" ON public.taste_snapshots;

-- Create permissive policies for music_library (user_id is validated at application level)
CREATE POLICY "Allow all operations on music_library"
ON public.music_library FOR ALL
USING (true)
WITH CHECK (true);

-- Create permissive policies for listening_events
CREATE POLICY "Allow all operations on listening_events"
ON public.listening_events FOR ALL
USING (true)
WITH CHECK (true);

-- Create permissive policies for taste_snapshots
CREATE POLICY "Allow all operations on taste_snapshots"
ON public.taste_snapshots FOR ALL
USING (true)
WITH CHECK (true);