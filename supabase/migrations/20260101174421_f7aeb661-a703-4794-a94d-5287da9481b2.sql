-- Add sync columns to crates table
ALTER TABLE crates 
ADD COLUMN IF NOT EXISTS spotify_playlist_id TEXT,
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'unsynced',
ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Add indexes for sync queries
CREATE INDEX IF NOT EXISTS idx_crates_sync_enabled 
ON crates(sync_enabled) WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_crates_spotify_playlist_id 
ON crates(spotify_playlist_id) WHERE spotify_playlist_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN crates.spotify_playlist_id IS 'Linked Spotify playlist ID';
COMMENT ON COLUMN crates.sync_enabled IS 'Whether auto-sync to Spotify is enabled';
COMMENT ON COLUMN crates.last_synced_at IS 'Last successful sync timestamp';
COMMENT ON COLUMN crates.sync_status IS 'Current sync state: synced, pending, error, unsynced';
COMMENT ON COLUMN crates.sync_error IS 'Last sync error message if failed';