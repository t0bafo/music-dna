-- Create crates table for user's music collections
CREATE TABLE public.crates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📦',
  color TEXT DEFAULT '#1DB954',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crate_tracks junction table
CREATE TABLE public.crate_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crate_id UUID NOT NULL REFERENCES public.crates(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vibe_tags table for tag library (future AI use)
CREATE TABLE public.vibe_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('mood', 'scene', 'moment', 'era')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tag_assignments for entity-tag relationships (future AI use)
CREATE TABLE public.tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'crate')),
  entity_id TEXT NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.vibe_tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('ai', 'user')),
  confidence REAL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, tag_id)
);

-- Create track_cache for metadata caching
CREATE TABLE public.track_cache (
  track_id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  artist_name TEXT,
  album_name TEXT,
  album_art_url TEXT,
  duration_ms INTEGER,
  popularity INTEGER,
  bpm REAL,
  energy REAL,
  danceability REAL,
  valence REAL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_crates_user_id ON public.crates(user_id);
CREATE INDEX idx_crate_tracks_crate_id ON public.crate_tracks(crate_id);
CREATE INDEX idx_crate_tracks_track_id ON public.crate_tracks(track_id);
CREATE INDEX idx_tag_assignments_entity ON public.tag_assignments(entity_type, entity_id);
CREATE INDEX idx_vibe_tags_type ON public.vibe_tags(tag_type);

-- Enable RLS on all tables (deny all direct access, operations go through edge functions)
ALTER TABLE public.crates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crate_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies: deny all direct access (same pattern as existing tables)
CREATE POLICY "Deny all direct access" ON public.crates AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.crate_tracks AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.vibe_tags AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.tag_assignments AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.track_cache AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

-- Create trigger for updating updated_at on crates
CREATE OR REPLACE FUNCTION public.update_crates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crates_updated_at
  BEFORE UPDATE ON public.crates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crates_updated_at();

-- Seed some common vibe tags
INSERT INTO public.vibe_tags (name, tag_type) VALUES
  ('chill', 'mood'),
  ('hype', 'mood'),
  ('melancholy', 'mood'),
  ('euphoric', 'mood'),
  ('intense', 'mood'),
  ('peaceful', 'mood'),
  ('party', 'scene'),
  ('driving', 'scene'),
  ('workout', 'scene'),
  ('study', 'scene'),
  ('dinner', 'scene'),
  ('beach', 'scene'),
  ('sunrise', 'moment'),
  ('sunset', 'moment'),
  ('late night', 'moment'),
  ('golden hour', 'moment'),
  ('90s', 'era'),
  ('2000s', 'era'),
  ('2010s', 'era'),
  ('modern', 'era');