-- Complete music library with audio features
CREATE TABLE public.music_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id TEXT NOT NULL,
  name TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  tempo REAL,
  energy REAL,
  danceability REAL,
  valence REAL,
  acousticness REAL,
  speechiness REAL,
  instrumentalness REAL,
  liveness REAL,
  popularity INTEGER,
  release_date DATE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  UNIQUE(track_id, user_id)
);

-- Track when user interacted with tracks
CREATE TABLE public.listening_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  playlist_id TEXT,
  playlist_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL
);

-- Historical snapshots of taste (weekly/monthly)
CREATE TABLE public.taste_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  avg_bpm REAL,
  avg_energy REAL,
  avg_danceability REAL,
  avg_valence REAL,
  underground_ratio REAL,
  total_tracks INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for music_library
CREATE POLICY "Users can view their own music library"
ON public.music_library FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own music library"
ON public.music_library FOR INSERT
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own music library"
ON public.music_library FOR UPDATE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own music library"
ON public.music_library FOR DELETE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for listening_events
CREATE POLICY "Users can view their own listening events"
ON public.listening_events FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own listening events"
ON public.listening_events FOR INSERT
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own listening events"
ON public.listening_events FOR DELETE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for taste_snapshots
CREATE POLICY "Users can view their own taste snapshots"
ON public.taste_snapshots FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own taste snapshots"
ON public.taste_snapshots FOR INSERT
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own taste snapshots"
ON public.taste_snapshots FOR UPDATE
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Add indexes for performance
CREATE INDEX idx_music_library_user ON public.music_library(user_id);
CREATE INDEX idx_music_library_track ON public.music_library(track_id);
CREATE INDEX idx_listening_events_user ON public.listening_events(user_id);
CREATE INDEX idx_listening_events_track ON public.listening_events(track_id);
CREATE INDEX idx_taste_snapshots_user ON public.taste_snapshots(user_id);
CREATE INDEX idx_taste_snapshots_date ON public.taste_snapshots(snapshot_date);