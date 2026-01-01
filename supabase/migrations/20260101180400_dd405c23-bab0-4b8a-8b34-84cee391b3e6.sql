-- Add genre columns to track_cache
ALTER TABLE track_cache 
ADD COLUMN IF NOT EXISTS artist_genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artist_id TEXT;

-- Add comments
COMMENT ON COLUMN track_cache.artist_genres IS 'Genre tags from Spotify artist data (e.g., afrobeats, amapiano)';
COMMENT ON COLUMN track_cache.artist_id IS 'Spotify artist ID for fetching genres';

-- Add index for genre search using GIN for array operations
CREATE INDEX IF NOT EXISTS idx_track_cache_genres 
ON track_cache USING GIN (artist_genres);

CREATE INDEX IF NOT EXISTS idx_track_cache_artist_id 
ON track_cache(artist_id) WHERE artist_id IS NOT NULL;

-- Add genre columns to music_library for richer personal library
ALTER TABLE music_library
ADD COLUMN IF NOT EXISTS artist_genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artist_id TEXT,
ADD COLUMN IF NOT EXISTS album_art_url TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Add index for genre search on music_library
CREATE INDEX IF NOT EXISTS idx_music_library_genres 
ON music_library USING GIN (artist_genres);

-- Add comments
COMMENT ON COLUMN music_library.artist_genres IS 'Genre tags from Spotify artist data';
COMMENT ON COLUMN music_library.artist_id IS 'Spotify artist ID for fetching genres';