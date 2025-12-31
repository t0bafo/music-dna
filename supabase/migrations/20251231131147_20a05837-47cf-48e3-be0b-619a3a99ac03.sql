-- Add vibe_keywords array to crates table for semantic search
ALTER TABLE crates 
ADD COLUMN IF NOT EXISTS vibe_keywords TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN crates.vibe_keywords IS 'Mood/vibe keywords for semantic search (e.g., night, chill, energy)';